'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Search, BookOpen, ChevronDown } from 'lucide-react'

// ============================================
// CONTENU MODIFIABLE - Glossaire des termes
// ============================================
const glossaryTerms = [
  // === A ===
  {
    term: 'ANAH',
    fullName: 'Agence Nationale de l\'Habitat',
    category: 'Organisme',
    definition: 'Établissement public qui gère les aides à la rénovation énergétique, notamment MaPrimeRénov\'. L\'ANAH est votre interlocuteur principal pour les demandes d\'aides.',
    related: ['MaPrimeRénov\'', 'Aides financières'],
  },
  {
    term: 'Aides financières',
    fullName: null,
    category: 'Finance',
    definition: 'Ensemble des dispositifs permettant de financer vos travaux de rénovation : MaPrimeRénov\', CEE, éco-PTZ, aides locales. Le montant dépend de vos revenus et des travaux réalisés.',
    related: ['MaPrimeRénov\'', 'CEE', 'Éco-PTZ'],
  },
  {
    term: 'Artisan RGE',
    fullName: 'Artisan Reconnu Garant de l\'Environnement',
    category: 'Professionnel',
    definition: 'Professionnel certifié pour réaliser des travaux de rénovation énergétique. Faire appel à un artisan RGE est obligatoire pour bénéficier des aides MaPrimeRénov\' et CEE.',
    related: ['RGE', 'Devis', 'Travaux éligibles'],
  },
  {
    term: 'Attestation sur l\'honneur',
    fullName: null,
    category: 'Document',
    definition: 'Document signé par le demandeur certifiant l\'exactitude des informations fournies. Elle engage votre responsabilité et est requise à plusieurs étapes du dossier.',
    related: ['Mandat', 'Dossier'],
  },
  // === C ===
  {
    term: 'CEE',
    fullName: 'Certificats d\'Économies d\'Énergie',
    category: 'Aide',
    definition: 'Dispositif obligeant les fournisseurs d\'énergie à promouvoir les économies d\'énergie. En pratique, cela se traduit par des primes versées aux particuliers réalisant des travaux de rénovation.',
    related: ['Prime énergie', 'Aides financières', 'Obligés'],
  },
  {
    term: 'Chaudière biomasse',
    fullName: null,
    category: 'Équipement',
    definition: 'Système de chauffage utilisant des combustibles d\'origine végétale (bois, granulés, bûches). Éligible aux aides MaPrimeRénov\' et CEE pour son faible impact environnemental.',
    related: ['Chauffage performant', 'Travaux éligibles'],
  },
  {
    term: 'Chauffage performant',
    fullName: null,
    category: 'Travaux',
    definition: 'Catégorie de travaux incluant l\'installation d\'équipements de chauffage à haute performance énergétique : pompe à chaleur, chaudière biomasse, système solaire combiné.',
    related: ['PAC', 'Chaudière biomasse', 'Travaux éligibles'],
  },
  // === D ===
  {
    term: 'Devis',
    fullName: null,
    category: 'Document',
    definition: 'Document détaillant les travaux prévus, les matériaux utilisés et le prix. Le devis doit être établi par un artisan RGE et validé par KOPRO avant le début des travaux.',
    related: ['Artisan RGE', 'Facture', 'Étape 5'],
  },
  {
    term: 'DPE',
    fullName: 'Diagnostic de Performance Énergétique',
    category: 'Document',
    definition: 'Document obligatoire évaluant la consommation énergétique d\'un logement (échelle A à G). Il permet d\'identifier les travaux prioritaires et peut conditionner certaines aides.',
    related: ['Audit énergétique', 'Performance énergétique'],
  },
  {
    term: 'Dossier',
    fullName: null,
    category: 'Administratif',
    definition: 'Ensemble des documents et informations constituant votre demande d\'aide. KOPRO vous accompagne dans la constitution et le suivi de votre dossier de A à Z.',
    related: ['Mandat', 'Étapes'],
  },
  // === E ===
  {
    term: 'Éco-PTZ',
    fullName: 'Éco-Prêt à Taux Zéro',
    category: 'Finance',
    definition: 'Prêt bancaire sans intérêts destiné à financer des travaux de rénovation énergétique. Cumulable avec MaPrimeRénov\' et les CEE sous certaines conditions.',
    related: ['Aides financières', 'Financement'],
  },
  {
    term: 'Étapes',
    fullName: null,
    category: 'Parcours',
    definition: 'Le parcours KOPRO comprend 8 étapes : création compte, identifiant MPR, signature mandat, sélection travaux, dépôt devis, autorisation travaux, dépôt factures, récapitulatif final.',
    related: ['Dossier', 'Guide interactif'],
  },
  // === F ===
  {
    term: 'Facture',
    fullName: null,
    category: 'Document',
    definition: 'Document émis par l\'artisan après réalisation des travaux, détaillant les prestations effectuées et le montant à payer. Indispensable pour le versement des aides.',
    related: ['Devis', 'Artisan RGE', 'Étape 7'],
  },
  // === I ===
  {
    term: 'Identifiant MPR',
    fullName: 'Identifiant MaPrimeRénov\'',
    category: 'Administratif',
    definition: 'Code unique au format MPR-XXXXAB attribué lors de la création de votre compte sur maprimerenov.gouv.fr. Il permet de lier votre dossier KOPRO à votre demande officielle.',
    related: ['MaPrimeRénov\'', 'Étape 2'],
  },
  {
    term: 'Isolation',
    fullName: null,
    category: 'Travaux',
    definition: 'Travaux visant à limiter les déperditions thermiques du logement : isolation des murs, toiture, planchers bas, remplacement des fenêtres. Souvent prioritaires pour améliorer la performance énergétique.',
    related: ['Menuiseries', 'Travaux éligibles', 'Performance énergétique'],
  },
  // === K ===
  {
    term: 'KOPRO',
    fullName: null,
    category: 'Service',
    definition: 'Plateforme d\'accompagnement pour vos démarches de rénovation énergétique. KOPRO simplifie la constitution de votre dossier MaPrimeRénov\' et CEE de A à Z.',
    related: ['Mon Accompagnateur Rénov\'', 'Mandat'],
  },
  // === M ===
  {
    term: 'Mandat',
    fullName: 'Mandat d\'accompagnement',
    category: 'Document',
    definition: 'Document juridique vous autorisant KOPRO à effectuer les démarches administratives en votre nom auprès de l\'ANAH et des organismes CEE. Obligatoire pour que nous puissions agir pour vous.',
    related: ['KOPRO', 'Étape 3', 'ANAH'],
  },
  {
    term: 'MaPrimeRénov\'',
    fullName: null,
    category: 'Aide',
    definition: 'Aide financière de l\'État pour la rénovation énergétique des logements. Le montant varie selon vos revenus (4 catégories) et le type de travaux. Versée après réalisation des travaux.',
    related: ['ANAH', 'Aides financières', 'Identifiant MPR'],
  },
  {
    term: 'Menuiseries',
    fullName: null,
    category: 'Travaux',
    definition: 'Désigne les fenêtres, portes-fenêtres et volets. Leur remplacement par des modèles performants (double/triple vitrage) est éligible aux aides de rénovation énergétique.',
    related: ['Isolation', 'Travaux éligibles'],
  },
  {
    term: 'Mon Accompagnateur Rénov\'',
    fullName: 'MAR',
    category: 'Service',
    definition: 'Professionnel agréé par l\'État pour accompagner les particuliers dans leurs projets de rénovation énergétique. KOPRO travaille avec des conseillers MAR agréés.',
    related: ['KOPRO', 'ANAH'],
  },
  // === O ===
  {
    term: 'Obligés',
    fullName: null,
    category: 'Organisme',
    definition: 'Fournisseurs d\'énergie (EDF, Engie, Total...) tenus par la loi de promouvoir les économies d\'énergie. Ils financent les primes CEE versées aux particuliers.',
    related: ['CEE', 'Prime énergie'],
  },
  // === P ===
  {
    term: 'PAC',
    fullName: 'Pompe à Chaleur',
    category: 'Équipement',
    definition: 'Système de chauffage écologique qui puise les calories dans l\'air, l\'eau ou le sol pour chauffer le logement. Très performant et fortement subventionné par les aides.',
    related: ['Chauffage performant', 'Travaux éligibles'],
  },
  {
    term: 'Performance énergétique',
    fullName: null,
    category: 'Concept',
    definition: 'Mesure de l\'efficacité d\'un logement en termes de consommation d\'énergie. L\'objectif des travaux de rénovation est d\'améliorer cette performance (passer d\'une classe G à D par exemple).',
    related: ['DPE', 'Travaux éligibles'],
  },
  {
    term: 'Prime énergie',
    fullName: null,
    category: 'Aide',
    definition: 'Autre nom des aides CEE versées par les fournisseurs d\'énergie. Cumulable avec MaPrimeRénov\' pour réduire significativement le reste à charge.',
    related: ['CEE', 'Obligés', 'Aides financières'],
  },
  // === R ===
  {
    term: 'Reste à charge',
    fullName: null,
    category: 'Finance',
    definition: 'Montant restant à payer par le particulier après déduction de toutes les aides (MaPrimeRénov\', CEE, autres). KOPRO vous aide à optimiser ce reste à charge.',
    related: ['Aides financières', 'Financement'],
  },
  {
    term: 'RGE',
    fullName: 'Reconnu Garant de l\'Environnement',
    category: 'Certification',
    definition: 'Label qualité attribué aux professionnels du bâtiment formés aux travaux de rénovation énergétique. Condition obligatoire pour que vos travaux soient éligibles aux aides.',
    related: ['Artisan RGE', 'Travaux éligibles'],
  },
  // === T ===
  {
    term: 'Travaux éligibles',
    fullName: null,
    category: 'Travaux',
    definition: 'Travaux ouvrant droit aux aides : isolation (murs, toiture, planchers, fenêtres), chauffage (PAC, chaudière biomasse), eau chaude (solaire, thermodynamique), ventilation (VMC).',
    related: ['Isolation', 'Chauffage performant', 'VMC'],
  },
  // === V ===
  {
    term: 'VMC',
    fullName: 'Ventilation Mécanique Contrôlée',
    category: 'Équipement',
    definition: 'Système de ventilation assurant le renouvellement de l\'air intérieur. La VMC double flux, qui récupère la chaleur de l\'air extrait, est éligible aux aides de rénovation.',
    related: ['Ventilation', 'Travaux éligibles'],
  },
  {
    term: 'Ventilation',
    fullName: null,
    category: 'Travaux',
    definition: 'Catégorie de travaux concernant l\'installation ou le remplacement du système de ventilation du logement. Essentiel pour la qualité de l\'air, surtout après isolation.',
    related: ['VMC', 'Travaux éligibles'],
  },
]

// ============================================
// Catégories pour le filtrage
// ============================================
const categories = [
  { value: 'all', label: 'Toutes les catégories' },
  { value: 'Aide', label: 'Aides financières' },
  { value: 'Travaux', label: 'Travaux' },
  { value: 'Document', label: 'Documents' },
  { value: 'Équipement', label: 'Équipements' },
  { value: 'Organisme', label: 'Organismes' },
  { value: 'Administratif', label: 'Administratif' },
  { value: 'Finance', label: 'Finance' },
  { value: 'Service', label: 'Services' },
  { value: 'Certification', label: 'Certifications' },
  { value: 'Professionnel', label: 'Professionnels' },
  { value: 'Concept', label: 'Concepts' },
  { value: 'Parcours', label: 'Parcours KOPRO' },
]

// Couleurs par catégorie
const categoryColors: Record<string, string> = {
  Aide: 'bg-green-100 text-green-700',
  Travaux: 'bg-orange-100 text-orange-700',
  Document: 'bg-blue-100 text-blue-700',
  Équipement: 'bg-purple-100 text-purple-700',
  Organisme: 'bg-indigo-100 text-indigo-700',
  Administratif: 'bg-gray-100 text-gray-700',
  Finance: 'bg-emerald-100 text-emerald-700',
  Service: 'bg-primary-100 text-primary-700',
  Certification: 'bg-amber-100 text-amber-700',
  Professionnel: 'bg-cyan-100 text-cyan-700',
  Concept: 'bg-pink-100 text-pink-700',
  Parcours: 'bg-violet-100 text-violet-700',
}

export function Glossary() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [expandedTerm, setExpandedTerm] = useState<string | null>(null)

  // Filtrer les termes
  const filteredTerms = glossaryTerms.filter((item) => {
    const matchesSearch =
      searchQuery === '' ||
      item.term.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.definition.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.fullName && item.fullName.toLowerCase().includes(searchQuery.toLowerCase()))

    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory

    return matchesSearch && matchesCategory
  })

  // Grouper par lettre
  const groupedTerms = filteredTerms.reduce(
    (acc, term) => {
      const letter = term.term[0].toUpperCase()
      if (!acc[letter]) acc[letter] = []
      acc[letter].push(term)
      return acc
    },
    {} as Record<string, typeof glossaryTerms>
  )

  const letters = Object.keys(groupedTerms).sort()

  return (
    <div className="space-y-4">
      {/* Barre de recherche et filtre */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Recherche */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher un terme..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>

        {/* Filtre catégorie */}
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
        >
          {categories.map((cat) => (
            <option key={cat.value} value={cat.value}>
              {cat.label}
            </option>
          ))}
        </select>
      </div>

      {/* Compteur de résultats */}
      <p className="text-sm text-gray-500">
        {filteredTerms.length} terme{filteredTerms.length > 1 ? 's' : ''} trouvé
        {filteredTerms.length > 1 ? 's' : ''}
      </p>

      {/* Navigation alphabétique */}
      {letters.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {letters.map((letter) => (
            <a
              key={letter}
              href={`#letter-${letter}`}
              className="w-8 h-8 flex items-center justify-center text-sm font-medium text-primary-600 hover:bg-primary-50 rounded transition-colors"
            >
              {letter}
            </a>
          ))}
        </div>
      )}

      {/* Liste des termes */}
      {letters.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <BookOpen className="h-12 w-12 mx-auto mb-3 text-gray-300" />
          <p>Aucun terme trouvé pour cette recherche.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {letters.map((letter) => (
            <div key={letter} id={`letter-${letter}`}>
              {/* Lettre */}
              <div className="sticky top-0 bg-white py-2 z-10 border-b">
                <span className="text-xl font-bold text-primary-600">{letter}</span>
              </div>

              {/* Termes de cette lettre */}
              <div className="space-y-2 mt-2">
                {groupedTerms[letter].map((item) => {
                  const isExpanded = expandedTerm === item.term

                  return (
                    <div
                      key={item.term}
                      className={cn(
                        'border rounded-lg overflow-hidden transition-all',
                        isExpanded ? 'border-primary-300 shadow-sm' : 'border-gray-200'
                      )}
                    >
                      {/* En-tête du terme */}
                      <button
                        onClick={() => setExpandedTerm(isExpanded ? null : item.term)}
                        className="w-full flex items-center justify-between p-3 text-left hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <span className="font-semibold text-gray-900">{item.term}</span>
                          {item.fullName && (
                            <span className="text-sm text-gray-500 hidden sm:inline">
                              ({item.fullName})
                            </span>
                          )}
                          <span
                            className={cn(
                              'text-xs px-2 py-0.5 rounded-full',
                              categoryColors[item.category] || 'bg-gray-100 text-gray-700'
                            )}
                          >
                            {item.category}
                          </span>
                        </div>
                        <ChevronDown
                          className={cn(
                            'h-4 w-4 text-gray-400 transition-transform',
                            isExpanded && 'rotate-180'
                          )}
                        />
                      </button>

                      {/* Contenu étendu */}
                      {isExpanded && (
                        <div className="px-3 pb-3 border-t bg-gray-50">
                          {item.fullName && (
                            <p className="text-sm text-gray-500 mt-2 sm:hidden">
                              {item.fullName}
                            </p>
                          )}
                          <p className="text-gray-700 mt-2">{item.definition}</p>

                          {/* Termes liés */}
                          {item.related.length > 0 && (
                            <div className="mt-3">
                              <span className="text-xs font-medium text-gray-500">
                                Termes liés :
                              </span>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {item.related.map((rel) => (
                                  <button
                                    key={rel}
                                    onClick={() => {
                                      setSearchQuery(rel)
                                      setSelectedCategory('all')
                                    }}
                                    className="text-xs px-2 py-1 bg-white border border-gray-200 rounded-full text-primary-600 hover:bg-primary-50 transition-colors"
                                  >
                                    {rel}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
