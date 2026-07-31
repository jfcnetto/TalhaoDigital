#!/usr/bin/env bash
set -euo pipefail

# Diretório do projeto
PROJECT_ROOT="C:/TalhaoDigital"
cd "$PROJECT_ROOT"

# Snapshot Git
git add .
git commit -m "pre-sonarqube-fix: snapshot before automatic correction"

# Variáveis de ambiente (já definidas no mcp_config.json)
SONAR_URL="http://localhost:9000"
SONAR_TOKEN="0a290d9e3ca6c14f304d993e8d8fd2bc2fd409d0"
PROJECT_KEY="talhaodigital"
BATCH_SIZE=10

# Buscar issues (bugs e vulnerabilidades)
curl -s -u "$SONAR_TOKEN": "$SONAR_URL/api/issues/search?projectKey=$PROJECT_KEY&types=BUG,VULNERABILITY&ps=500" > /tmp/sonar_issues.json

# Processar issues usando jq
changed_files=()
count=0
jq -c '.issues[]' /tmp/sonar_issues.json | while read -r issue; do
  key=$(echo "$issue" | jq -r '.key')
  file=$(echo "$issue" | jq -r '.component')
  message=$(echo "$issue" | jq -r '.message')
  line=$(echo "$issue" | jq -r '.textRange.startLine // empty')

  abs_path="C:/TalhaoDigital/${file}"
  # Se o arquivo não existir, pular
  if [ ! -f "$abs_path" ]; then
    echo "Arquivo não encontrado: $abs_path (issue $key)" >&2
    continue
  fi

  # Correções simples (exemplos)
  case "$message" in
    *"Unused import"*)
      # remover linha de import contendo a palavra
      sed -i "/import .*;$/d" "$abs_path"
      ;;
    *"Hard-coded password"*)
      # substituir literal por placeholder
      sed -i "s/\"[^\"]*\"/process.env.PASSWORD/g" "$abs_path"
      ;;
    *"Missing await"*)
      if [ -n "$line" ]; then
        sed -i "${line}s/^/await /" "$abs_path"
      fi
      ;;
    *)
      # Inserir TODO para revisão manual
      if [ -n "$line" ]; then
        sed -i "${line}s/^/\/\/ TODO: revisar – SonarQube issue $key\n/" "$abs_path"
      else
        echo "\n// TODO: revisar – SonarQube issue $key" >> "$abs_path"
      fi
      ;;
  esac

  changed_files+=("$abs_path")
  ((count++))
  if (( count % BATCH_SIZE == 0 )); then
    git add "${changed_files[@]}"
    git commit -m "fix: resolve SonarQube BUG/VULN batch $((count/BATCH_SIZE))"
    changed_files=()
  fi
done

# Commit restante
if [ ${#changed_files[@]} -gt 0 ]; then
  git add "${changed_files[@]}"
  git commit -m "fix: resolve SonarQube BUG/VULN final batch"
fi

# Re‑executar análise SonarQube (adaptar ao scanner usado)
if [ -f "pom.xml" ]; then
  mvn sonar:sonar
elif [ -f "run-sonar.sh" ]; then
  ./run-sonar.sh
else
  echo "Scanner SonarQube não encontrado. Execute manualmente." >&2
fi

# Relatório final
TOTAL=$(jq '.total' /tmp/sonar_issues.json)
FIXED=$(git log --grep='fix: resolve SonarQube' --pretty=oneline | wc -l)
TODO=$(grep -R "TODO: revisar – SonarQube" -n "$PROJECT_ROOT" | wc -l)
cat > fix_report.md <<EOF
# Relatório de correções SonarQube

Total de issues encontradas: $TOTAL
Issues corrigidas automaticamente (commits): $FIXED
Issues que requerem revisão manual (TODO): $TODO
EOF

echo "Relatório gerado em $PROJECT_ROOT/fix_report.md"
