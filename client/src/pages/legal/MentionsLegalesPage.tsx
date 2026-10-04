import LegalLayout from './LegalLayout'

export default function MentionsLegalesPage() {
  return (
    <LegalLayout title="Mentions legales">
      <section>
        <h2 className="font-serif text-lg text-brand-900">1. Editeur du site</h2>
        <p>
          Le present site / application est edite par <strong>[A COMPLETER - raison sociale]</strong>, [A COMPLETER - forme juridique,
          ex. SASU, SARL], au capital social de [A COMPLETER] euros, immatriculee au Registre du Commerce et des Societes de
          [A COMPLETER - ville] sous le numero SIREN [A COMPLETER], dont le siege social est situe [A COMPLETER - adresse complete].
        </p>
        <p>Numero de TVA intracommunautaire : [A COMPLETER]</p>
        <p>Directeur de la publication : [A COMPLETER - nom et qualite]</p>
        <p>Contact : [A COMPLETER - email] - [A COMPLETER - telephone]</p>
      </section>

      <section>
        <h2 className="font-serif text-lg text-brand-900">2. Activite d'intermediation immobiliere (Loi Hoguet)</h2>
        <p>
          En qualite de mandataire en transactions immobilieres (vente de biens en l'etat futur d'achevement - VEFA),
          [A COMPLETER - raison sociale] exerce son activite conformement a la loi n°70-9 du 2 janvier 1970 (dite
          "Loi Hoguet") et a son decret d'application n°72-678 du 20 juillet 1972.
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Carte professionnelle "Transactions sur immeubles et fonds de commerce" (carte T) n° [A COMPLETER], delivree par la CCI de [A COMPLETER]</li>
          <li>Garantie financiere : [A COMPLETER - nom de l'organisme garant et montant], ou mention "Ne detient pas de fonds" le cas echeant</li>
          <li>Assurance responsabilite civile professionnelle souscrite aupres de [A COMPLETER], [A COMPLETER - adresse de l'assureur]</li>
          <li>Organisme de controle habilite : Chambre de Commerce et d'Industrie de [A COMPLETER]</li>
        </ul>
        <p className="mt-2">
          Si l'activite s'exerce en tant qu'agent commercial mandataire d'un ou plusieurs agents immobiliers titulaires
          de la carte T (regime de l'article 4 de la loi Hoguet, sans detention de carte propre), remplacer la section
          ci-dessus par les references de la carte T du mandant et le numero d'immatriculation au registre special des
          agents commerciaux (RSAC).
        </p>
      </section>

      <section>
        <h2 className="font-serif text-lg text-brand-900">3. Hebergement</h2>
        <p>
          L'application est hebergee par [A COMPLETER - nom de l'hebergeur], [A COMPLETER - adresse], [A COMPLETER - telephone].
        </p>
      </section>

      <section>
        <h2 className="font-serif text-lg text-brand-900">4. Propriete intellectuelle</h2>
        <p>
          L'ensemble des elements composant cette application (structure, textes, logos, charte graphique) sont, sauf
          mention contraire, la propriete exclusive de [A COMPLETER - raison sociale] ou de ses partenaires. Toute
          reproduction, representation, modification ou adaptation totale ou partielle est interdite sans autorisation
          prealable ecrite.
        </p>
      </section>

      <section>
        <h2 className="font-serif text-lg text-brand-900">5. Donnees personnelles</h2>
        <p>
          Le traitement des donnees personnelles est decrit dans notre <a href="/confidentialite" className="text-accent-600 hover:underline">politique de confidentialite</a>.
        </p>
      </section>

      <section>
        <h2 className="font-serif text-lg text-brand-900">6. Mediation de la consommation</h2>
        <p>
          Conformement aux dispositions du Code de la consommation concernant le reglement amiable des litiges, [A
          COMPLETER - raison sociale] adhere au service de mediation [A COMPLETER - nom du mediateur], dont les
          coordonnees sont les suivantes : [A COMPLETER]. Cette section ne s'applique que si l'activite implique des
          clients consommateurs (B2C) au sens du droit francais.
        </p>
      </section>
    </LegalLayout>
  )
}
