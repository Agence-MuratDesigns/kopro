import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight, Shield, Clock, FileCheck, MessageCircle } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-white">
      {/* Header */}
      <header className="container py-6 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-xl">K</span>
          </div>
          <span className="text-2xl font-bold text-gray-900">KOPRO</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/login">
            <Button variant="ghost">Connexion</Button>
          </Link>
          <Link href="/register">
            <Button>Créer un compte</Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="container py-16 md:py-24">
        <div className="max-w-4xl mx-auto text-center">
          <span className="inline-block px-4 py-2 bg-primary-100 text-primary-700 rounded-full text-sm font-medium mb-6">
            Mon Accompagnateur Rénov' agréé
          </span>
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6 text-balance">
            Suivez votre dossier{' '}
            <span className="text-primary-600">MaPrimeRénov'</span> en toute
            sérénité
          </h1>
          <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
            KOPRO vous accompagne étape par étape dans vos démarches
            administratives pour obtenir vos aides à la rénovation énergétique.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register">
              <Button size="lg" className="w-full sm:w-auto">
                Commencer mon dossier
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="w-full sm:w-auto">
                J'ai déjà un compte
              </Button>
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="mt-24 grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          <FeatureCard
            icon={<Shield className="h-8 w-8 text-primary-600" />}
            title="Sécurisé"
            description="Vos données sont protégées et votre parcours est conforme aux exigences réglementaires."
          />
          <FeatureCard
            icon={<Clock className="h-8 w-8 text-primary-600" />}
            title="Suivi en temps réel"
            description="Visualisez l'avancement de votre dossier à chaque étape du processus."
          />
          <FeatureCard
            icon={<FileCheck className="h-8 w-8 text-primary-600" />}
            title="Parcours guidé"
            description="Un parcours séquentiel qui vous guide dans chaque démarche administrative."
          />
          <FeatureCard
            icon={<MessageCircle className="h-8 w-8 text-primary-600" />}
            title="Support dédié"
            description="Échangez directement avec votre conseiller KOPRO à tout moment."
          />
        </div>

        {/* Steps Preview */}
        <div className="mt-24 bg-white rounded-2xl p-8 md:p-12 shadow-xl border border-gray-100">
          <h2 className="text-2xl md:text-3xl font-bold text-center text-gray-900 mb-12">
            Un accompagnement complet en 16 étapes
          </h2>
          <div className="grid md:grid-cols-4 gap-6">
            <StepPreview
              number={1}
              category="Éligibilité"
              steps={['Vérification éligibilité', 'Documents initiaux', 'Signature mandat']}
              color="bg-purple-500"
            />
            <StepPreview
              number={2}
              category="Audit & Devis"
              steps={['Audit énergétique', 'Collecte devis', 'Validation technique']}
              color="bg-blue-500"
            />
            <StepPreview
              number={3}
              category="Demandes"
              steps={["Dépôt MaPrimeRénov'", 'Accord MPR', 'Demande CEE']}
              color="bg-green-500"
            />
            <StepPreview
              number={4}
              category="Travaux & Paiement"
              steps={['Suivi travaux', 'Contrôle conformité', 'Versement aides']}
              color="bg-orange-500"
            />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="container py-8 border-t border-gray-200 mt-24">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">K</span>
            </div>
            <span className="font-semibold text-gray-900">KOPRO</span>
            <span className="text-gray-500">- Mon Accompagnateur Rénov'</span>
          </div>
          <p className="text-sm text-gray-500">
            © {new Date().getFullYear()} KOPRO. Tous droits réservés.
          </p>
        </div>
      </footer>
    </div>
  )
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
      <div className="mb-4">{icon}</div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  )
}

function StepPreview({
  number,
  category,
  steps,
  color,
}: {
  number: number
  category: string
  steps: string[]
  color: string
}) {
  return (
    <div className="text-center">
      <div
        className={`w-10 h-10 ${color} text-white rounded-full flex items-center justify-center font-bold mx-auto mb-4`}
      >
        {number}
      </div>
      <h3 className="font-semibold text-gray-900 mb-3">{category}</h3>
      <ul className="space-y-2">
        {steps.map((step, index) => (
          <li key={index} className="text-sm text-gray-600">
            {step}
          </li>
        ))}
      </ul>
    </div>
  )
}
