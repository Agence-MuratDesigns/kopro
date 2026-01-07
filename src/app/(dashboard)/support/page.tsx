import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { ContactForm } from './contact-form'
import { FaqAccordion } from './faq-accordion'
import {
  HelpCircle,
  MessageSquare,
  FileText,
  Clock,
  Euro,
  Home,
  Phone,
  Mail,
} from 'lucide-react'

const faqCategories = [
  {
    title: 'Parcours administratif',
    icon: FileText,
    items: [
      {
        question: "Comment fonctionne le parcours KOPRO ?",
        answer: "Le parcours KOPRO se déroule en 8 étapes : création de votre compte par notre équipe, saisie de votre identifiant MaPrimeRénov', signature du mandat, sélection des travaux, dépôt des devis, autorisation des travaux, dépôt des factures, et récapitulatif final. Chaque étape doit être validée avant de passer à la suivante."
      },
      {
        question: "Qu'est-ce que l'identifiant MaPrimeRénov' ?",
        answer: "L'identifiant MaPrimeRénov' est un code unique au format MPR-XXXXAB (4 chiffres + 2 lettres) que vous obtenez lors de la création de votre compte sur maprimerenov.gouv.fr. Il permet de lier votre dossier KOPRO à votre demande d'aide officielle."
      },
      {
        question: "Pourquoi dois-je signer un mandat ?",
        answer: "Le mandat d'accompagnement nous autorise à effectuer les démarches administratives en votre nom auprès de l'ANAH et des organismes CEE. Sans ce mandat, nous ne pouvons pas déposer votre dossier pour vous."
      },
      {
        question: "Puis-je modifier mes informations après validation ?",
        answer: "Une fois une étape validée, les informations ne peuvent plus être modifiées pour garantir l'intégrité de votre dossier. En cas d'erreur, contactez votre conseiller KOPRO."
      },
    ]
  },
  {
    title: 'Documents requis',
    icon: FileText,
    items: [
      {
        question: "Quels documents dois-je fournir ?",
        answer: "Les documents varient selon les étapes : pièce d'identité, justificatif de domicile, avis d'imposition, devis des artisans RGE, puis factures à la fin des travaux. Chaque étape vous indique précisément les documents attendus."
      },
      {
        question: "Dans quel format déposer mes documents ?",
        answer: "Les documents doivent être au format PDF, avec une taille maximale de 10 Mo par fichier. Assurez-vous que les documents sont lisibles et complets."
      },
      {
        question: "Comment savoir si mes devis sont conformes ?",
        answer: "Nos équipes vérifient chaque devis : présence des mentions légales, certification RGE de l'artisan, cohérence des montants, respect des critères techniques. Vous êtes notifié en cas de problème."
      },
    ]
  },
  {
    title: 'Aides financières',
    icon: Euro,
    items: [
      {
        question: "Quelles aides puis-je obtenir ?",
        answer: "Vous pouvez bénéficier de MaPrimeRénov' (aide de l'État) et des CEE (Certificats d'Économies d'Énergie). Le montant dépend de vos revenus, de votre zone géographique et des travaux réalisés."
      },
      {
        question: "Quand vais-je recevoir mes aides ?",
        answer: "Les aides MaPrimeRénov' sont versées après validation de votre dossier complet et vérification des travaux. Les délais varient de 2 à 4 mois selon les organismes. Les CEE sont généralement versés plus rapidement."
      },
      {
        question: "Comment sont calculées les aides ?",
        answer: "Les montants sont calculés selon votre catégorie de revenus (très modestes, modestes, intermédiaires, supérieurs), le type de travaux et les plafonds en vigueur. Votre conseiller KOPRO vous fournit une estimation."
      },
    ]
  },
  {
    title: 'Travaux',
    icon: Home,
    items: [
      {
        question: "Quels travaux sont éligibles ?",
        answer: "Les travaux éligibles incluent : isolation (murs, toiture, planchers, fenêtres), chauffage performant (pompe à chaleur, chaudière biomasse), eau chaude sanitaire (chauffe-eau solaire, thermodynamique), et ventilation (VMC double flux)."
      },
      {
        question: "Dois-je choisir des artisans RGE ?",
        answer: "Oui, pour bénéficier des aides MaPrimeRénov' et CEE, vos travaux doivent obligatoirement être réalisés par des artisans certifiés RGE (Reconnu Garant de l'Environnement)."
      },
      {
        question: "Puis-je commencer les travaux avant la validation des devis ?",
        answer: "Non, vous devez attendre la validation de vos devis par notre équipe avant de démarrer les travaux. Tout travail commencé avant cette validation peut compromettre votre éligibilité aux aides."
      },
    ]
  },
  {
    title: 'Délais et suivi',
    icon: Clock,
    items: [
      {
        question: "Combien de temps dure le parcours complet ?",
        answer: "La durée dépend de votre réactivité et de celle des artisans. En moyenne, comptez 2 à 3 semaines pour la partie administrative avant travaux, puis le temps de réalisation des travaux, et 1 à 2 semaines pour la clôture du dossier."
      },
      {
        question: "Comment suivre l'avancement de mon dossier ?",
        answer: "Votre tableau de bord affiche en temps réel l'état de votre dossier, l'étape en cours et les actions à réaliser. Vous recevez également des notifications par email et dans l'application."
      },
      {
        question: "Que faire si mon étape est bloquée ?",
        answer: "Si une étape est bloquée (document refusé, information manquante), un message vous explique la raison. Corrigez le problème indiqué et resoumettez votre étape."
      },
    ]
  },
]

export default async function SupportPage() {
  const user = await requireAuth()

  // Get user's active dossier for contact form
  const dossier = await prisma.dossier.findFirst({
    where: { clientId: user.id, isActive: true },
    select: { id: true, reference: true },
  })

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Support & Aide</h1>
        <p className="text-gray-600 mt-1">
          Trouvez des réponses à vos questions ou contactez notre équipe
        </p>
      </div>

      {/* Quick Contact Info */}
      <div className="grid sm:grid-cols-2 gap-4">
        <Card className="bg-primary-50 border-primary-200">
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary-100 rounded-lg">
                <Phone className="h-5 w-5 text-primary-600" />
              </div>
              <div>
                <p className="font-medium text-primary-900">Par téléphone</p>
                <p className="text-sm text-primary-700">01 23 45 67 89</p>
                <p className="text-xs text-primary-600">Lun-Ven 9h-18h</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-green-50 border-green-200">
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Mail className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="font-medium text-green-900">Par email</p>
                <p className="text-sm text-green-700">support@kopro.fr</p>
                <p className="text-xs text-green-600">Réponse sous 24h</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* FAQ Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5" />
            Questions fréquentes
          </CardTitle>
          <CardDescription>
            Retrouvez les réponses aux questions les plus courantes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FaqAccordion categories={faqCategories} />
        </CardContent>
      </Card>

      {/* Contact Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Nous contacter
          </CardTitle>
          <CardDescription>
            Une question spécifique ? Envoyez-nous un message
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ContactForm dossierId={dossier?.id} />
        </CardContent>
      </Card>
    </div>
  )
}
