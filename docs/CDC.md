# **0\. Couverture**

Présentation finale · Lomé Summer School en IA 2026

Nom du projet : Now

Logo : public/logo-nowpay.png

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

logo : public/logo-nowpay.png