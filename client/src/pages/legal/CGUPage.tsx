import LegalLayout from './LegalLayout'

export default function CGUPage() {
  return (
    <LegalLayout title="Conditions generales d'utilisation">
      <section>
        <h2 className="font-serif text-lg text-brand-900">1. Objet</h2>
        <p>
          Les presentes conditions generales d'utilisation (CGU) regissent l'acces et l'utilisation de l'application
          Vefalys (ci-apres "l'Application"), outil interne de gestion commerciale et comptable destine aux equipes de
          [A COMPLETER - raison sociale] et, le cas echeant, a ses mandataires et partenaires habilites.
        </p>
      </section>

      <section>
        <h2 className="font-serif text-lg text-brand-900">2. Acces et comptes utilisateurs</h2>
        <p>
          L'acces a l'Application est reserve aux personnes disposant d'un compte cree par un administrateur. Chaque
          utilisateur est responsable de la confidentialite de ses identifiants et de toute activite realisee depuis son
          compte. Toute suspicion d'acces non autorise doit etre signalee sans delai a un administrateur.
        </p>
        <p>
          Les comptes sont nominatifs et ne doivent pas etre partages. L'administrateur peut desactiver, modifier ou
          supprimer un compte a tout moment, notamment en cas de depart d'un collaborateur ou de violation des presentes CGU.
        </p>
      </section>

      <section>
        <h2 className="font-serif text-lg text-brand-900">3. Description du service</h2>
        <p>L'Application permet notamment de :</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Gerer un portefeuille de contacts et de prospects (CRM) ;</li>
          <li>Suivre un pipeline commercial et des dossiers de vente immobiliere en VEFA ;</li>
          <li>Programmer des relances et des rendez-vous ;</li>
          <li>Suivre des factures, des depenses et produire des indicateurs financiers ;</li>
          <li>Archiver des documents lies a chaque dossier ;</li>
          <li>Generer des projets de documents (mandats, offres, compromis) necessitant une validation professionnelle avant usage.</li>
        </ul>
      </section>

      <section>
        <h2 className="font-serif text-lg text-brand-900">4. Obligations de l'utilisateur</h2>
        <p>L'utilisateur s'engage a :</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Utiliser l'Application conformement a sa destination professionnelle ;</li>
          <li>Ne saisir que des donnees exactes et ne porter atteinte ni aux droits de tiers ni a la reglementation applicable (notamment en matiere de protection des donnees personnelles) ;</li>
          <li>Ne pas tenter de contourner les mesures de securite ni d'acceder a des donnees ou fonctionnalites non autorisees pour son role ;</li>
          <li>Signaler sans delai tout dysfonctionnement ou faille de securite constate.</li>
        </ul>
      </section>

      <section>
        <h2 className="font-serif text-lg text-brand-900">5. Documents generes par l'Application</h2>
        <p>
          Les documents generes automatiquement par l'Application (mandats, offres d'achat, compromis, etc.) sont des
          <strong> projets de documents</strong> fournis a titre indicatif. Ils ne constituent pas des actes juridiquement
          valides en l'etat et doivent systematiquement etre relus, completes et valides par un professionnel du droit
          (notaire, juriste) avant toute signature ou envoi a un tiers. [A COMPLETER - raison sociale] decline toute
          responsabilite quant a l'usage de ces documents sans validation prealable.
        </p>
      </section>

      <section>
        <h2 className="font-serif text-lg text-brand-900">6. Donnees personnelles</h2>
        <p>
          Le traitement des donnees a caractere personnel au sein de l'Application est decrit dans la
          <a href="/confidentialite" className="text-accent-600 hover:underline"> politique de confidentialite</a>, qui
          fait partie integrante des presentes CGU.
        </p>
      </section>

      <section>
        <h2 className="font-serif text-lg text-brand-900">7. Disponibilite et responsabilite</h2>
        <p>
          [A COMPLETER - raison sociale] s'efforce d'assurer un acces continu a l'Application mais ne peut garantir une
          disponibilite ininterrompue (maintenance, incident technique, cas de force majeure). [A COMPLETER - raison
          sociale] ne saurait etre tenue responsable des dommages indirects resultant de l'utilisation ou de
          l'impossibilite d'utiliser l'Application.
        </p>
      </section>

      <section>
        <h2 className="font-serif text-lg text-brand-900">8. Propriete intellectuelle</h2>
        <p>
          L'Application, son code, sa structure et ses elements graphiques demeurent la propriete exclusive de [A
          COMPLETER - raison sociale]. Aucune cession de droit n'est consentie a l'utilisateur au-dela du droit d'usage
          necessaire a l'exercice de ses fonctions.
        </p>
      </section>

      <section>
        <h2 className="font-serif text-lg text-brand-900">9. Modification des CGU</h2>
        <p>
          [A COMPLETER - raison sociale] peut modifier les presentes CGU a tout moment. Les utilisateurs seront informes
          de toute modification substantielle. La poursuite de l'utilisation de l'Application vaut acceptation des CGU modifiees.
        </p>
      </section>

      <section>
        <h2 className="font-serif text-lg text-brand-900">10. Droit applicable</h2>
        <p>Les presentes CGU sont soumises au droit francais. Tout litige relatif a leur interpretation ou leur execution relevera des tribunaux competents de [A COMPLETER - ville].</p>
      </section>

      <p className="pt-2 text-xs text-brand-400">Derniere mise a jour : [A COMPLETER - date]</p>
    </LegalLayout>
  )
}
