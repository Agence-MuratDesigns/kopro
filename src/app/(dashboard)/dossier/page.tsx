import { redirect } from 'next/navigation'

export default function DossierRedirectPage() {
  // Redirect to the dossiers list page
  redirect('/dossiers')
}
