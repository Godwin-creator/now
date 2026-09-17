# **0\. Couverture**

Présentation finale · Lomé Summer School en IA 2026

Nom du projet : Now

Logo : ![][image1]

Slogan : “Relancez juste. Récupérez vite."&nbsp;

Équipe : Godwin EDOH BEDI, ANENOU Godwin, AMEKPO Romuald, TCHAKOURA Abdoul-Rachid, NAZA Komlan Charbel.

# **1\. Contexte — Pourquoi ce projet²**

Les PME Africaine opèrent dans un environnement où 80 % de la force de travail relève du secteur informel, sans contrats formels ni outils de gestion des paiements. Pourtant, les impayés y constituent une menace directe sur leur survie : 53 % des dirigeants de PME ont déjà vu leur pérennité financière menacée par des factures non réglées, et 25 % des faillites sont causées par des créances non recouvrées.

&nbsp;

La recherche montre qu'une relance bien menée peut récupérer jusqu'à 80 % des créances en moins de 30 jours — mais qu'au-delà de 90 jours, ce taux tombe à **30 %**. Tout se joue dans les premières semaines.

&nbsp;

Le problème réel n'est pas l'absence d'information : le gérant sait qui ne l'a pas payé. Le problème est qu'il ne sait pas quoi dire, comment le dire, quel ton adopter, ni par quel canal — sans risquer de perdre son client.

&nbsp;

Les solutions existantes (Clearnox, Payt, Defacto) sont des outils européens, coûteux, complexes et inadaptés au contexte local. L'affacturage existe au Togo mais reste inaccessible à la PME ordinaire. Aucun outil ne répond au gérant de Lomé qui gère ses affaires depuis un téléphone.

# **2\. Le problème**

Les PME africaines n'ont pas de processus de relance structuré. Face à un retard de paiement, elles hésitent entre le silence (pour préserver la relation avec le client) et un message maladroit qui la détériore. L'impayé s'installe, la trésorerie se fragilise.

# **3\. Les utilisateurs**

* **Cible principale :** Dirigeants, comptables, responsables administratifs et commerciaux (Gérants de PME de services, commerce ou BTP, qui émettent des factures à des clients professionnels et gèrent leurs affaires depuis leur téléphone).

&nbsp;

* **Besoin identifié :** Permettre au gérant de relancer efficacement ses clients en retard de paiement grâce à des messages adaptés au profil, au retard et au canal retenu, sans nécessiter de compétences comptables ni d'outils complexes.

# **4\. La solution (description générale)**

“Now” est une application web *mobile-first* qui génère des messages de relance professionnels automatisés grâce à l'IA (sur une fréquence de temps que l’admin peut prédéfinir) ou qu’il peut décider d’envoyer manuellement, adaptés au profil du client, au niveau de retard (durée) et au canal de contact disponible.

## **4.1 Parcours utilisateur V1 (manuel)**

1. Le gérant ouvre l'application sur son téléphone.  
2. Il renseigne : client **"Kofi Agence"**, **45 000 FCFA**, **12 jours de retard**, client **régulier**, profil **professionnel**, canal **email**.  
3. L'application affiche : *Risque faible*, *ton formel recommandé*, *timing suggéré aujourd'hui*.  
4. Un email structuré apparaît — objet, corps, formule de politesse — au nom de l'entreprise, sans émoji.  
5. Le gérant copie ou transfère directement — en moins d'une minute.

&nbsp;

Le gérant renseigne les informations concernant le client:

&nbsp;

1. Nom du client  
2. Montant dû  
3. Date du service rendu (la date d'échéance est calculée automatiquement à J+30)  
4. Type de relation (*nouveau / régulier / difficile*)  
5. Profil du client (*particulier informel / professionnel / corporate ou institutionnel, entreprise*)  
6. Canal disponible (*email / WhatsApp / SMS / Tel*)

&nbsp;

Les informations du client sont enregistrées et actualisées sur le dashboard admin à la section “Créances”. Le dashboard contient une section “Historique” dans laquelle se trouve l’historique des créances réglées et les rappels (ou relances) qui ont été envoyés.  
Chaque section (créances, historique) sera équipée d’une fonctionnalité de filtrage.&nbsp;

&nbsp;

&nbsp;

## **4.2 Logique des canaux**

| Canal | Profil recommandé | Avantage |
| :---- | :---- | :---- |
| **Email** | Corporate, institutionnel, professionnel | Trace écrite, image sérieuse |
| **WhatsApp** | PME locale, commerçant, client informel | Taux de lecture très élevé le jour même |
| **SMS** | Client sans WhatsApp confirmé | Universel, lu en moyenne en moins de 5 minutes |
| **Appel suggéré** | Retard \> 45 jours, risque élevé | Non automatisé — recommandé par l'app |

# **4.3 Utilisation de l'IA \+ algorithme de scoring**

L'IA est le cœur fonctionnel de la solution. Elle intervient pour :

&nbsp;

* **Évaluer le niveau de risque** à l'aide d'un algorithme de scoring précis :  
  * **Formule :** Score \= (Jours de retard / 90\) × 40 \+ (Montant / Montant max) × 30 \+ (Retards précédents × 10\) \[max 30 pts\]  
  * **Interprétation des résultats :**  
    * 0–33 → 🟢 Faible (relance courtoise J+7)  
    * 34–66 → 🟡 Moyen (relance directe aujourd'hui)  
    * 67–85 → 🟠 Élevé (relance ferme \+ escalade)  
* 86–100 → 🔴 Critique (appel téléphonique recommandé)  
* **Adapter le ton :** formel et institutionnel pour un client corporate, direct et courtois pour un client régulier, neutre et factuel pour un nouveau client.  
* **Formater le message selon le canal :** objet \+ corps structuré pour l'email, message court et lisible pour le SMS, message intermédiaire pour WhatsApp.  
* **Rédiger au nom de l'entreprise :** toujours à la première personne du pluriel ("Nous"), sans émojis, sans familiarité non justifiée.  
* **Recommander le timing** et suggérer une escalade progressive si la première relance reste sans réponse.

&nbsp;

**Valeur ajoutée exclusive :** Ce qu'aucun modèle statique ne peut faire est d'adapter simultanément le ton, la formulation et le format selon trois variables indépendantes — profil du client, niveau de retard, et canal de contact.

# **5\. Architecture technique**

5.1 Stack

**Stack suggérée (MVP) :** Next.js 14 (App Router), Supabase (Auth \+ DB), Tailwind CSS, Lucide React (Framer Motion est reporté en V2)

— déployable sur Vercel.

## **5.2 Schéma BDD Supabase**

La base de données hébergée sur Supabase est structurée autour des tables principales suivantes :

* **companies :** Informations sur l'entreprise admin (id, nom, email, created\_at).  
* **clients :** Répertoire des clients (id, company\_id, nom, email, téléphone, whatsapp, profil, secteur, retards\_precedents).  
* **factures :** Suivi des factures dûes (id, company\_id, client\_id, montant\_fcfa, date\_service, date\_echeance, statut, type\_relation, canal\_contact, score\_risque, niveau\_risque).  
* **relances :** Journal de bord des relances (id, facture\_id, canal, message\_genere, statut\_envoi, created\_at).  
* **paiements :** Suivi des règlements (id, facture\_id, montant\_paye, date\_paiement).

## **5.3 Authentification**

L'authentification est gérée via Supabase Auth (Email / Mot de passe). Le système est configuré en mono-tenant avec un seul administrateur par entreprise. La sécurité des données est renforcée par les politiques RLS (Row Level Security) garantissant qu'un utilisateur n'accède qu'aux données de sa propre entreprise.

# **6\. Prototype V1 — Fonctionnalités**

## **6.1 Dashboard (KPIs \+ navigation)**

Tableau de bord affichant les indicateurs clés (KPIs) : Créances actives, Montant dû total (FCFA), En retard (nb), et À relancer aujourd'hui.

## **6.2 Section Créances (liste \+ filtres)**

Affichage de l'ensemble des créances actives avec filtres détaillés : Statut, Niveau de risque, Jours de retard, Canal de contact, et recherche globale par nom de client.

## **6.3 Section Historique (filtres)**

Consignation des créances réglées et des relances (messages générés/envoyés) avec filtres par Type d'entrée, Période et Client.

## **6.4 Formulaire nouvelle créance**

Saisie rapide des informations clients et factures (Nom, Montant, Date de facture, Type de relation, Profil client, Canal disponible).

## **6.5 Génération de message (IA)**

Génération instantanée par l’IA du message de relance approprié selon les variables configurées, selon deux modes principaux :

* **Cas 1 : Messages automatisés (prévus pour la V2)** — L’administrateur active l’automatisation depuis le dashboard et définit la fréquence des rappels (ex. chaque lundi à 9 h GMT). L'envoi s'effectue automatiquement pour toute créance non marquée comme réglée.

**Cas 2 : Parcours d'envoi manuel (V1)** — Le gérant accède à la section "Créances", sélectionne la facture en retard et clique sur "Générer une relance". L'IA produit un message sur mesure. Le gérant peut relire et modifier le texte, puis le copier pour l'envoyer directement via le canal choisi. Dès que l'envoi est validé, l'action est enregistrée dans l'historique.

&nbsp;

Exemple de message généré (Email, Profil professionnel) :

**Objet :** Relance — Facture n°\[XXX\] — 45 000 FCFA

&nbsp;

Madame, Monsieur,

&nbsp;

Nous nous permettons de vous adresser ce message concernant la facture n°\[XXX\] d'un montant de 45 000 FCFA, dont l'échéance est dépassée depuis le \[date\].

&nbsp;

Sauf erreur de notre part, ce règlement n'a pas encore été enregistré. Nous vous serions reconnaissants de bien vouloir procéder au paiement dans les meilleurs délais, ou de nous contacter si vous souhaitez convenir d'un arrangement.

&nbsp;

Nous restons disponibles pour tout échange à ce sujet.

&nbsp;

Cordialement,  
\[Nom de l'entreprise\]

* 7\. Ce qui est V2 (automatisation, WhatsApp API, SMS, multilingue)

# **8\. Valeur et impact**

* **Pour le gérant :** Une relance systématique, sans improvisation, sans perte de temps.  
* **Pour l'image de la PME :** Des messages professionnels, au bon ton selon l'interlocuteur.  
* **Pour la relation client :** Ni trop agressif, ni trop timide — le message préserve la relation tout en réclamant le paiement.  
* **Pour la trésorerie :** Une relance à J+7 multiplie par 2 à 3 les chances de recouvrement par rapport à une relance tardive.

## **9\. Limites actuelles**

* L'IA optimise la communication, elle ne garantit pas le paiement.  
* Le prototype ne gère pas l'historique multi-factures ni les relances successives de façon automatique.  
* La qualité du message dépend de la précision des informations saisies par le gérant.

&nbsp;

&nbsp;

*Document de travail — Lomé Summer School en IA 2026*

[image1]: <data:image/png;base64,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>