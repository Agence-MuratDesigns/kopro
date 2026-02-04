'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import { InteractiveGuide } from './interactive-guide'
import { Glossary } from './glossary'
import { FaqAccordion } from './faq-accordion'
import {
  Map,
  BookOpen,
  HelpCircle,
  FileText,
  Euro,
  Home,
  Clock,
} from 'lucide-react'

// ============================================
// CONTENU MODIFIABLE - FAQ
// ============================================
const faqCategories = [
  {
    title: 'Parcours administratif',
    icon: 'FileText',
    items: [
      {
        question: "Comment fonctionne le parcours KOPRO ?",
        answer: "Le parcours KOPRO se déroule en 8 étapes : création de votre compte par notre équipe, saisie de votre identifiant MaPrimeRénov', signature du mandat, sélection des travaux, dépôt des devis, démarrage des travaux, dépôt des factures, et récapitulatif final. Chaque étape doit être validée avant de passer à la suivante."
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
      {
        question: "Comment puis-je suivre l'avancement de mon dossier ?",
        answer: "Votre tableau de bord affiche en temps réel l'état de votre dossier : l'étape en cours, les actions à réaliser et l'historique des validations. Vous recevez également des notifications par email à chaque changement de statut."
      },
    ]
  },
  {
    title: 'Documents requis',
    icon: 'FileText',
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
      {
        question: "Que faire si un document est refusé ?",
        answer: "En cas de refus, vous recevez un message expliquant la raison. Corrigez le problème (document illisible, information manquante...) et redéposez le document corrigé dans votre espace."
      },
      {
        question: "Puis-je déposer plusieurs fichiers pour un même poste de travaux ?",
        answer: "Oui, vous pouvez déposer plusieurs fichiers PDF par zone de travaux si nécessaire. Assurez-vous que l'ensemble des documents couvre bien tous les travaux prévus."
      },
    ]
  },
  {
    title: 'Aides financières',
    icon: 'Euro',
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
      {
        question: "Puis-je cumuler plusieurs aides ?",
        answer: "Oui, MaPrimeRénov' et les CEE sont cumulables. Vous pouvez également bénéficier de l'éco-PTZ (prêt à taux zéro) et de certaines aides locales selon votre situation."
      },
      {
        question: "Quel est le reste à charge typique ?",
        answer: "Le reste à charge varie selon vos revenus et les travaux. Pour les ménages très modestes, il peut être réduit à 10-20% du montant total. KOPRO vous aide à optimiser vos aides pour minimiser ce reste."
      },
    ]
  },
  {
    title: 'Travaux',
    icon: 'Home',
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
      {
        question: "Comment vérifier qu'un artisan est RGE ?",
        answer: "Vous pouvez vérifier la certification RGE d'un artisan sur le site france-renov.gouv.fr. La certification doit être valide au moment de la signature du devis et de la réalisation des travaux."
      },
      {
        question: "Que se passe-t-il si les travaux coûtent plus cher que le devis ?",
        answer: "Si le montant final dépasse significativement le devis validé, cela peut impacter le versement des aides. Contactez votre conseiller KOPRO avant d'accepter tout surcoût important."
      },
    ]
  },
  {
    title: 'Délais et suivi',
    icon: 'Clock',
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
      {
        question: "Combien de temps prend la validation d'un document ?",
        answer: "La validation des documents (identifiant MPR, mandat, devis, factures) prend généralement 24 à 48 heures ouvrées. Vous êtes notifié dès que la validation est effectuée."
      },
      {
        question: "Puis-je créer un nouveau dossier après avoir terminé le premier ?",
        answer: "Oui, une fois votre dossier clôturé, vous pouvez créer un nouveau dossier pour d'autres travaux de rénovation énergétique depuis votre tableau de bord."
      },
    ]
  },
]

// ============================================
// Configuration des onglets
// ============================================
const tabs = [
  {
    id: 'guide',
    label: 'Guide du parcours',
    icon: Map,
    description: 'Découvrez chaque étape de votre parcours de rénovation',
  },
  {
    id: 'glossary',
    label: 'Glossaire',
    icon: BookOpen,
    description: 'Définitions des termes techniques et administratifs',
  },
  {
    id: 'faq',
    label: 'FAQ',
    icon: HelpCircle,
    description: 'Réponses aux questions fréquentes',
  },
]

export function SupportTabs() {
  const [activeTab, setActiveTab] = useState('guide')

  return (
    <Card>
      {/* Tabs Navigation */}
      <div className="border-b">
        <div className="flex overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap',
                  isActive
                    ? 'border-primary-500 text-primary-600 bg-primary-50/50'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                )}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Tab Content */}
      <CardContent className="pt-6">
        {/* Guide du parcours */}
        {activeTab === 'guide' && (
          <div>
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Map className="h-5 w-5 text-primary-500" />
                Guide interactif du parcours
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Cliquez sur chaque étape pour découvrir en détail ce que vous devez faire
              </p>
            </div>
            <InteractiveGuide />
          </div>
        )}

        {/* Glossaire */}
        {activeTab === 'glossary' && (
          <div>
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary-500" />
                Glossaire des termes
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Retrouvez les définitions de tous les termes techniques liés à la rénovation énergétique
              </p>
            </div>
            <Glossary />
          </div>
        )}

        {/* FAQ */}
        {activeTab === 'faq' && (
          <div>
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <HelpCircle className="h-5 w-5 text-primary-500" />
                Questions fréquentes
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Retrouvez les réponses aux questions les plus courantes
              </p>
            </div>
            <FaqAccordion categories={faqCategories} />
          </div>
        )}
      </CardContent>
    </Card>
  )
}
