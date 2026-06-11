import { redirect } from 'next/navigation';

export default function Home() {
  // Quando alguém acessar a raiz do site, joga direto pro login
  redirect('/login');
}
