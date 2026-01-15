'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import {
  UserPlus,
  FileCheck,
  PenTool,
  Wrench,
  FileText,
  PlayCircle,
  Receipt,
  CheckCircle2,
  ChevronRight,
  Info,
  AlertTriangle,
  Lightbulb,
} from 'lucide-react'

// ============================================
// CONTENU MODIFIABLE - Guide des 8 étapes
// ============================================
const guideSteps = [
  {
    number: 1,
    code: 'CLIENT_CREATION',
    title: 'Création de votre compte',
    shortTitle: 'Compte',
    icon: UserPlus,
    color: 'blue',
    actor: 'Admin',
    description: 'Votre conseiller KOPRO crée votre espace personnel sécurisé.',
    details: [
      'Un conseiller KOPRO crée votre compte avec vos informations personnelles',
      'Vous recevez un email avec vos identifiants de connexion',
      'Votre espace personnel est initialisé et prêt à l\'emploi',
    ],
    whatToDo: 'Vérifiez votre boîte email (et les spams) pour récupérer vos identifiants de connexion.',
    tips: [
      'Conservez précieusement vos identifiants',
      'Changez votre mot de passe lors de votre première connexion',
    ],
    warnings: [
      'Ne partagez jamais vos identifiants avec des tiers',
    ],
    duration: 'Immédiat',
  },
  {
    number: 2,
    code: 'MPR_IDENTIFIER',
    title: 'Identifiant MaPrimeRénov\'',
    shortTitle: 'MPR',
    icon: FileCheck,
    color: 'indigo',
    actor: 'Client',
    description: 'Renseignez votre identifiant MaPrimeRénov\' obtenu sur le site officiel.',
    details: [
      'Connectez-vous sur maprimerenov.gouv.fr pour créer votre compte',
      'Récupérez votre identifiant au format MPR-XXXXAB (4 chiffres + 2 lettres)',
      'Saisissez cet identifiant dans votre espace KOPRO',
      'Notre équipe vérifie et valide l\'identifiant',
    ],
    whatToDo: 'Créez votre compte sur maprimerenov.gouv.fr si ce n\'est pas déjà fait, puis saisissez votre identifiant MPR dans l\'application.',
    tips: [
      'L\'identifiant est au format MPR-1234AB',
      'Vérifiez bien les chiffres et lettres avant de valider',
      'Si vous n\'avez pas encore de compte MPR, créez-le d\'abord',
    ],
    warnings: [
      'Un identifiant incorrect bloquera la suite de votre parcours',
      'Attendez la validation avant de passer à l\'étape suivante',
    ],
    duration: '24-48h pour la validation',
  },
  {
    number: 3,
    code: 'MANDATE_SIGNATURE',
    title: 'Signature du mandat',
    shortTitle: 'Mandat',
    icon: PenTool,
    color: 'purple',
    actor: 'Client',
    description: 'Signez le mandat qui nous autorise à effectuer les démarches en votre nom.',
    details: [
      'Téléchargez le mandat pré-rempli avec vos informations',
      'Choisissez entre signature électronique ou manuscrite',
      'Si signature manuscrite : imprimez, signez, scannez et déposez le PDF',
      'Si signature électronique : suivez le processus en ligne',
    ],
    whatToDo: 'Téléchargez le mandat, signez-le (électroniquement ou manuellement) et déposez-le dans votre espace.',
    tips: [
      'La signature électronique est plus rapide et validée automatiquement',
      'Pour la signature manuscrite, assurez-vous que le scan soit lisible',
      'Le mandat doit être signé par le propriétaire du logement',
    ],
    warnings: [
      'Sans ce mandat, nous ne pouvons pas déposer votre dossier d\'aides',
      'Vérifiez que toutes les informations sont correctes avant de signer',
    ],
    duration: 'Immédiat (électronique) ou 24-48h (manuscrit)',
  },
  {
    number: 4,
    code: 'WORK_SELECTION',
    title: 'Sélection des travaux',
    shortTitle: 'Travaux',
    icon: Wrench,
    color: 'orange',
    actor: 'Client',
    description: 'Indiquez les types de travaux de rénovation que vous souhaitez réaliser.',
    details: [
      'Cochez les catégories de travaux envisagés',
      'Isolation / Menuiseries (murs, toiture, fenêtres...)',
      'Chauffage performant (pompe à chaleur, chaudière biomasse...)',
      'Eau chaude sanitaire (chauffe-eau solaire, thermodynamique...)',
      'Ventilation (VMC double flux...)',
    ],
    whatToDo: 'Sélectionnez tous les types de travaux que vous prévoyez de réaliser, puis validez votre sélection.',
    tips: [
      'Vous pouvez sélectionner plusieurs types de travaux',
      'Cette sélection détermine les devis à fournir ensuite',
      'Consultez votre conseiller si vous hésitez sur les travaux éligibles',
    ],
    warnings: [
      'Assurez-vous de sélectionner tous les travaux prévus',
      'Les travaux doivent être réalisés par des artisans RGE',
    ],
    duration: 'Validation automatique',
  },
  {
    number: 5,
    code: 'QUOTE_DEPOSIT',
    title: 'Dépôt des devis',
    shortTitle: 'Devis',
    icon: FileText,
    color: 'cyan',
    actor: 'Client',
    description: 'Déposez les devis des artisans RGE pour chaque type de travaux sélectionné.',
    details: [
      'Obtenez des devis d\'artisans certifiés RGE',
      'Déposez un PDF par zone de travaux (format PDF, max 10 Mo)',
      'Cochez la case de confirmation une fois tous les devis déposés',
      'Notre équipe vérifie la conformité des devis',
    ],
    whatToDo: 'Téléchargez les devis de vos artisans au format PDF dans les zones correspondantes, puis validez le dépôt.',
    tips: [
      'Vérifiez que vos artisans sont bien certifiés RGE',
      'Les devis doivent mentionner les critères techniques exigés',
      'Assurez-vous que les devis sont lisibles et complets',
    ],
    warnings: [
      'Ne commencez PAS les travaux avant la validation des devis',
      'Des devis non conformes retarderont votre dossier',
    ],
    duration: '2-5 jours pour la vérification',
  },
  {
    number: 6,
    code: 'WORK_AUTHORIZATION',
    title: 'Autorisation des travaux',
    shortTitle: 'Autorisation',
    icon: PlayCircle,
    color: 'green',
    actor: 'Client',
    description: 'Une fois les devis validés, vous pouvez démarrer vos travaux.',
    details: [
      'Vous recevez la confirmation que vos devis sont conformes',
      'Vous êtes autorisé à démarrer les travaux avec vos artisans',
      'Cliquez sur "Notifier le début des travaux" quand ils commencent',
      'Conservez tous les documents pendant la durée des travaux',
    ],
    whatToDo: 'Attendez la validation de vos devis, puis cliquez sur le bouton pour signaler le début des travaux.',
    tips: [
      'Conservez précieusement toutes les factures',
      'Prenez des photos avant/après si possible',
      'Gardez contact avec votre conseiller pendant les travaux',
    ],
    warnings: [
      'Ne commencez les travaux qu\'après avoir reçu l\'autorisation',
      'Tout travail anticipé peut compromettre vos aides',
    ],
    duration: 'Variable selon vos travaux',
  },
  {
    number: 7,
    code: 'INVOICE_DEPOSIT',
    title: 'Dépôt des factures',
    shortTitle: 'Factures',
    icon: Receipt,
    color: 'amber',
    actor: 'Client',
    description: 'Une fois les travaux terminés, déposez toutes les factures finales.',
    details: [
      'Récupérez les factures finales auprès de vos artisans',
      'Déposez chaque facture au format PDF dans la zone correspondante',
      'Vérifiez que les montants correspondent aux devis validés',
      'Cochez la case de confirmation et validez',
    ],
    whatToDo: 'Téléchargez toutes les factures de vos travaux terminés et validez le dépôt pour finaliser votre dossier.',
    tips: [
      'Les factures doivent correspondre aux devis validés',
      'Vérifiez les mentions obligatoires sur les factures',
      'Assurez-vous que les factures sont acquittées',
    ],
    warnings: [
      'Des factures incomplètes retarderont le versement des aides',
      'Les montants ne doivent pas dépasser significativement les devis',
    ],
    duration: '2-5 jours pour la vérification',
  },
  {
    number: 8,
    code: 'FINAL_RECAP',
    title: 'Récapitulatif final',
    shortTitle: 'Clôture',
    icon: CheckCircle2,
    color: 'emerald',
    actor: 'Admin',
    description: 'Votre dossier est clôturé. Consultez le récapitulatif et attendez le versement.',
    details: [
      'Consultez le récapitulatif complet de votre dossier',
      'Téléchargez tous vos documents (devis, factures, attestations)',
      'Suivez l\'état du versement de vos aides',
      'Possibilité de créer un nouveau dossier si besoin',
    ],
    whatToDo: 'Votre dossier est complet ! Consultez le récapitulatif et patientez pour le versement de vos aides.',
    tips: [
      'Conservez une copie de tous les documents',
      'Les délais de versement varient selon les organismes',
      'Vous pouvez créer un nouveau dossier pour d\'autres travaux',
    ],
    warnings: [
      'Les délais de versement MaPrimeRénov\' sont de 2 à 4 mois',
    ],
    duration: '2-4 mois pour le versement',
  },
]

// ============================================
// Couleur principale (violet/primary)
// ============================================
const primaryColor = {
  bg: 'bg-primary-500',
  text: 'text-primary-600',
  border: 'border-primary-200',
  light: 'bg-primary-50'
}

export function InteractiveGuide() {
  const [selectedStep, setSelectedStep] = useState(guideSteps[0])

  return (
    <div className="space-y-6">
      {/* Timeline Navigation */}
      <div className="flex items-center justify-between overflow-x-auto pb-2 gap-1">
        {guideSteps.map((step) => {
          const isSelected = selectedStep.number === step.number
          const Icon = step.icon

          return (
            <button
              key={step.number}
              onClick={() => setSelectedStep(step)}
              className={cn(
                'flex flex-col items-center min-w-[80px] p-2 rounded-lg transition-all',
                isSelected
                  ? `${primaryColor.light} ${primaryColor.border} border-2`
                  : 'hover:bg-gray-50 border-2 border-transparent'
              )}
            >
              <div
                className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center mb-1 transition-all',
                  isSelected ? primaryColor.bg : 'bg-gray-200'
                )}
              >
                <Icon className={cn('h-5 w-5', isSelected ? 'text-white' : 'text-gray-500')} />
              </div>
              <span
                className={cn(
                  'text-xs font-medium text-center',
                  isSelected ? primaryColor.text : 'text-gray-500'
                )}
              >
                {step.shortTitle}
              </span>
              <span className="text-[10px] text-gray-400">Étape {step.number}</span>
            </button>
          )
        })}
      </div>

      {/* Selected Step Details */}
      <div className={cn('rounded-xl border-2 overflow-hidden', primaryColor.border)}>
        {/* Header */}
        <div className={cn('p-4', primaryColor.light)}>
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'w-12 h-12 rounded-full flex items-center justify-center',
                primaryColor.bg
              )}
            >
              <selectedStep.icon className="h-6 w-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className={cn('text-sm font-medium', primaryColor.text)}>
                  Étape {selectedStep.number}/8
                </span>
                <span className="text-xs px-2 py-0.5 bg-white rounded-full text-gray-600">
                  {selectedStep.actor === 'Client' ? 'Action client' : 'Action admin'}
                </span>
              </div>
              <h3 className="text-lg font-bold text-gray-900">{selectedStep.title}</h3>
            </div>
          </div>
          <p className="mt-3 text-gray-700">{selectedStep.description}</p>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4 bg-white">
          {/* Ce que vous devez faire */}
          <div className={cn('p-4 rounded-lg', primaryColor.light)}>
            <h4 className={cn('font-semibold flex items-center gap-2 mb-2', primaryColor.text)}>
              <ChevronRight className="h-4 w-4" />
              Ce que vous devez faire
            </h4>
            <p className="text-gray-700">{selectedStep.whatToDo}</p>
          </div>

          {/* Détails */}
          <div>
            <h4 className="font-semibold text-gray-900 flex items-center gap-2 mb-2">
              <Info className="h-4 w-4 text-primary-500" />
              Détails de l'étape
            </h4>
            <ul className="space-y-2">
              {selectedStep.details.map((detail, index) => (
                <li key={index} className="flex items-start gap-2 text-sm text-gray-600">
                  <span className={cn('mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0', primaryColor.bg)} />
                  {detail}
                </li>
              ))}
            </ul>
          </div>

          {/* Conseils */}
          <div className="p-3 bg-green-50 rounded-lg border border-green-200">
            <h4 className="font-semibold text-green-800 flex items-center gap-2 mb-2">
              <Lightbulb className="h-4 w-4" />
              Conseils
            </h4>
            <ul className="space-y-1">
              {selectedStep.tips.map((tip, index) => (
                <li key={index} className="text-sm text-green-700 flex items-start gap-2">
                  <span className="text-green-500">•</span>
                  {tip}
                </li>
              ))}
            </ul>
          </div>

          {/* Avertissements */}
          {selectedStep.warnings.length > 0 && (
            <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
              <h4 className="font-semibold text-amber-800 flex items-center gap-2 mb-2">
                <AlertTriangle className="h-4 w-4" />
                Points d'attention
              </h4>
              <ul className="space-y-1">
                {selectedStep.warnings.map((warning, index) => (
                  <li key={index} className="text-sm text-amber-700 flex items-start gap-2">
                    <span className="text-amber-500">•</span>
                    {warning}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Durée estimée */}
          <div className="flex items-center justify-between pt-3 border-t">
            <span className="text-sm text-gray-500">Durée estimée</span>
            <span className={cn('text-sm font-medium', primaryColor.text)}>
              {selectedStep.duration}
            </span>
          </div>
        </div>
      </div>

      {/* Navigation rapide */}
      <div className="flex justify-between">
        <button
          onClick={() => {
            const prevIndex = selectedStep.number - 2
            if (prevIndex >= 0) setSelectedStep(guideSteps[prevIndex])
          }}
          disabled={selectedStep.number === 1}
          className={cn(
            'px-4 py-2 text-sm rounded-lg transition-colors',
            selectedStep.number === 1
              ? 'text-gray-300 cursor-not-allowed'
              : 'text-gray-600 hover:bg-gray-100'
          )}
        >
          ← Étape précédente
        </button>
        <button
          onClick={() => {
            const nextIndex = selectedStep.number
            if (nextIndex < guideSteps.length) setSelectedStep(guideSteps[nextIndex])
          }}
          disabled={selectedStep.number === 8}
          className={cn(
            'px-4 py-2 text-sm rounded-lg transition-colors',
            selectedStep.number === 8
              ? 'text-gray-300 cursor-not-allowed'
              : 'text-gray-600 hover:bg-gray-100'
          )}
        >
          Étape suivante →
        </button>
      </div>
    </div>
  )
}
