import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Definição das rotas públicas
const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/blog(.*)",
  "/ferramentas(.*)",
  "/api/save-image(.*)",
  "/api/copy-assets(.*)",
  "/convert.html",
  "/api/webhooks/clerk(.*)",
]);

const middleware = clerkMiddleware((auth, request) => {
  if (!isPublicRoute(request)) {
    auth().protect();
  }
});

export default middleware;

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
