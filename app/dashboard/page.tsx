import { redirect } from 'next/navigation';

export default function DashboardPage() {
  // Redireciona todas as requisições do antigo /dashboard para o novo painel unificado /admin
  redirect('/admin');
}
