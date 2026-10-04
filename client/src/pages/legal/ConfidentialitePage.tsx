import LegalLayout from './LegalLayout'

export default function ConfidentialitePage() {
  return (
    <LegalLayout title="Politique de confidentialite">
      <section>
        <h2 className="font-serif text-lg text-brand-900">1. Responsable de traitement</h2>
        <p>
          [A COMPLETER - raison sociale], [A COMPLETER - adresse], est responsable du traitement des donnees a caractere
          personnel collectees via l'Application. Pour toute question relative a vos donnees : [A COMPLETER - email contact / DPO].
        </p>
      </section>

      <section>
        <h2 className="font-serif text-lg text-brand-900">2. Donnees collectees</h2>
        <p>L'Application traite deux categories de donnees personnelles :</p>
        <ul className="list-disc space-y-1 pl-5">
          <li><strong>Donnees des utilisateurs (collaborateurs)</strong> : nom, prenom, email professionnel, role, historique de connexion.</li>
          <li>
            <strong>Donnees des contacts et prospects</strong> : identite, coordonnees, situation professionnelle,
            criteres de recherche immobiliere (budget, typologie, localisation), historique des interactions,
            documents transmis (mandat, justificatifs de financement), donnees de facturation.
          </li>
        </ul>
      </section>

      <section>
        <h2 className="font-serif text-lg text-brand-900">3. Finalites du traitement</h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>Gestion de la relation commerciale et suivi des dossiers de vente immobiliere ;</li>
          <li>Gestion administrative et comptable (facturation, suivi des paiements) ;</li>
          <li>Organisation des relances, rendez-vous et taches internes ;</li>
          <li>Securite de l'Application (authentification, journalisation des actions sensibles).</li>
        </ul>
      </section>

      <section>
        <h2 className="font-serif text-lg text-brand-900">4. Base legale</h2>
        <p>
          Les traitements reposent sur l'execution de mesures precontractuelles et contractuelles (prospection et
          accompagnement des clients), sur l'interet legitime de [A COMPLETER - raison sociale] a gerer son activite
          commerciale, et sur le respect d'obligations legales (comptables, notamment).
        </p>
      </section>

      <section>
        <h2 className="font-serif text-lg text-brand-900">5. Duree de conservation</h2>
        <p>
          Les donnees des prospects sont conservees pendant [A COMPLETER - ex. 3 ans] a compter du dernier contact utile,
          conformement aux recommandations de la CNIL en matiere de prospection commerciale. Les documents a valeur
          comptable (factures) sont conserves pendant la duree legale applicable (10 ans en France). Au-dela, les
          donnees sont supprimees ou anonymisees.
        </p>
      </section>

      <section>
        <h2 className="font-serif text-lg text-brand-900">6. Vos droits</h2>
        <p>
          Conformement au Reglement General sur la Protection des Donnees (RGPD) et a la loi Informatique et Libertes,
          toute personne dispose d'un droit d'acces, de rectification, d'effacement, de limitation et d'opposition
          concernant ses donnees, ainsi que d'un droit a la portabilite.
        </p>
        <p>
          Pour exercer ces droits sur les donnees d'un contact, les utilisateurs habilites (administrateur ou manager)
          disposent, directement dans l'Application sur la fiche de chaque contact, d'un bouton <strong>"Exporter
          (RGPD)"</strong> (export integral des donnees au format JSON) et d'un bouton <strong>"Anonymiser"</strong>
          (suppression irreversible des donnees personnelles identifiantes, avec conservation des seules donnees a
          valeur comptable legalement obligatoires).
        </p>
        <p>
          Toute personne peut egalement exercer ses droits en ecrivant a [A COMPLETER - email contact]. En cas de
          reponse insatisfaisante, une reclamation peut etre adressee a la CNIL (www.cnil.fr).
        </p>
      </section>

      <section>
        <h2 className="font-serif text-lg text-brand-900">7. Destinataires des donnees</h2>
        <p>
          Les donnees sont accessibles aux seuls collaborateurs habilites de [A COMPLETER - raison sociale], selon leur
          role (Admin, Manager, Collaborateur), et le cas echeant aux promoteurs immobiliers partenaires dans le cadre
          strict du suivi d'un dossier de vente. Aucune donnee n'est cedee a des tiers a des fins commerciales.
        </p>
        <p>
          Si un prestataire tiers est utilise (hebergement, synchronisation Calendly, envoi d'emails), le completer ici
          avec le nom du prestataire, le pays de traitement des donnees et, le cas echeant, les garanties de transfert
          hors Union Europeenne (clauses contractuelles types, etc.).
        </p>
      </section>

      <section>
        <h2 className="font-serif text-lg text-brand-900">8. Securite</h2>
        <p>Des mesures techniques et organisationnelles sont mises en oeuvre pour proteger les donnees, notamment :</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Mots de passe stockes de maniere irreversible (hachage bcrypt), jamais en clair ;</li>
          <li>Acces aux fonctionnalites sensibles restreint selon le role de l'utilisateur ;</li>
          <li>Journalisation des actions sensibles (creation, modification, suppression) ;</li>
          <li>Chiffrement des echanges par HTTPS en production ;</li>
          <li>Limitation du nombre de tentatives de connexion pour prevenir les attaques par force brute.</li>
        </ul>
      </section>

      <section>
        <h2 className="font-serif text-lg text-brand-900">9. Cookies et stockage local</h2>
        <p>
          L'Application utilise le stockage local du navigateur (localStorage) pour conserver le jeton de connexion et
          la preference d'affichage (mode clair/sombre). Aucun cookie de suivi publicitaire ou de mesure d'audience
          tiers n'est utilise.
        </p>
      </section>

      <p className="pt-2 text-xs text-brand-400">Derniere mise a jour : [A COMPLETER - date]</p>
    </LegalLayout>
  )
}
