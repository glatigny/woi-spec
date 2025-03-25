# What is wrong with emails

[See reflexions on "what is wrong with emails"](what-is-wrong-with-emails.md)

# Introduce new concepts

![https://imgs.xkcd.com/comics/standards.png](https://imgs.xkcd.com/comics/standards.png) ![https://imgs.xkcd.com/comics/dependency.png](https://imgs.xkcd.com/comics/dependency.png)

Email (SMTP, IMAP, DKIM, DMARC...) should not have a "new competitor"; however, there is a need for a new concept based on other paradigms.

By adding lots of "tools" on top of the email (smtp) gives the impression of an instable tower and since the ecosystem is not uniform (various software which don't support the same RFC/features) most of them are not at full efficiency (such as SPF/DKIM/DMARC).

Instant messaging evolved a lot during the past years, each solution created its "standard" without a real inter-connection with others. "Signal Protocol" is starting to be the standard, pushing other solution to use their protocol for interoperability.

While "email" is an existing service, there is a need for a new asynchronous communication system; but more than that, there is a need of a (decentralized) identity system that will allow asynchronous communications.

Due to the variety of needs, it is better to try to split the needs in different tools. These needs should be inter-connected, each one with a "simple" (and as possible "atomic") task.\
Split must not be on security; it is important not reproducing the same problems than SMTP/SPF/DKIM/DMARC or, at the inverse, PGP.

## Importance of open standard and open-source tools

The history of SMTP versus X.400 is controversial. Because SMTP had open-source tools freely available under Linux, the usage of that protocol was easier than X.400; it might be a "game changer" for its worldwide adoption.

Even if companies need to have a "business plan" and have services (or products) to sold, for a vast adoption of a technology, it needs to be freely available.\
While "proton mail" propose a free service of "secure email" (with extra solution for communication with non-proton mail users), the service is free but closed. The technology is not published or known, it is not possible to have the service "on premise". It is something only available via their company and servers; it is not open.

Social platforms are closed by definition since they want to centralize the users and be able to push ads, sell other services, etc. They need to keep their users in their platform and they do not want interoperability.

The asynchronous electronic communication must be between people and they need to own their data. They need to be able to change where it is stored, to backup it, etc.
With the recent events in world politics, foreign interference, non-free speech, surveillance of data; countries should be able to be independent for their people communication, without possible foreign interference or espionage from other countries, even if there are allies.

Unlike social platforms, asynchronous communication need a different approach to define how a person can contact another. They need to (really) know each other or use a process to allow them to trust the other.

That kind of spam/phising issue is growing and is affecting more than just email communication; it is spreading in social platforms and even in classical websites: for faking websites, generating fake content or crawling webpages. Cloud providers, proxies and other tools making difficult to identify who is "legit" and who is "faking".

# Concept: Identities and sub-identities

With the need of trust, we need to have identities; it allows cryptographic operation and secure communication establishment between parties.

Having identities mean that they includes personnel information that can be share.

Sub identities are like aliases, they should allow private communication between users without them nothing the "real" identity behind the account. The sub identities can also help the confidentiality.

If we consider identities for asynchronous communication, we need to include specific information to inform who "he/it is" (might be a human, a program) and what "he/it can do" (send or receive).

The identity must live and, in a way, the ecosystem should encourage key rotation in order to avoid long-term keys and old cryptographic algorithms.

The identity concept is close the cryptography and "social relations"; it should not provide any feature to perform communication but only how the data is stored and exchanged.
Therefore, the identity is composed of public and private keys for encryption and signature.

When two identities create a secure communication channel, they create new keys specifically for their exchanges. It results of a unique channel identifier attached to the chosen identities (or sub-identities) for each member in the secure communication.

*To be define:*
> How create a sub-identity (with partial identity details) and make the relation with the main identity without leaking the full personal details.\
Using a traditional signature, will use the chain of signature and go up to the root (country or independant provider).\
Depending the needs of identity details, the link between the sub-identity and the main identity can be high or low. A lower link means that it would be possible to use several sub-identities to create several accounts in a platform, without the possiblity to detect it. A high link must provide enough details to be able to know that one person is unique, so in a way, to provide an identifier of the main identity.

## Concept: On behalf of

Sharing an Identity should be possible but with the security and knowledge of who shared the "contact".

Proposal: Having a contact means having the public key of an identity, with some attributes and meta-data and signed by that identity. In the meta-data should be include the identifier of the identity that it is shared with. Thus, the block can be a proof.\
Then, sharing the identity means that the contact is encapsulate and signed with the identity within the contact (so he has the right to, if no attribute forbidden it).

That process is very important for organization, so it is possible to have a central directory that can share contacts within the company. It can also be useful for "social platforms" to have the right to put in contact two users for private communication (within the platform or not).

The approach might be name "share of trust", because you share one of your identity to "someone" with the trust that he can share it (with only one level of share to avoid complications).

## Concept: Chain of trust

World Wide Web is structured with the "roots of trust"; the Root CA (Certificate Authority) are known and stored in every devices. They are the roots for all the chain of security, every (public) certificates must be related to one of these roots.\
For private infrastructures, it is possible to create private CA and publish them into the devices of the domain.

Chain of trust is easier and smaller than "web of trust" and is more adapt to our organization: A company handles its employees (it must know them) and services.\
For the public domain, the administrations are the more logical instance. Just like they delivery identity paper, the digital identity should be a part of it. Sub-identities are there to prevent against direct tracking.

Direct trust is compatible with Chain of trust; when two identity establish their channel of communication, they store in their storage, the identity of the other (with the way to contact him) with attributes and signature.

The idea behind the chain of trust is to let countries manage the digital identiy with the administrative identity. A real person like a company would have an identity (or a Company identity to create identities for their employees).

Since the main identity is signed by an authority, that identity is precious and should be protected using a strong security system, such as a hardware cryptographic key for example. That key should be use the less possible and only for "administration" operation or recovery. Creation of "devices" to access the identity content (and sub-identities) should use that key.\
With one single point of failure, the organization (and rights) given to identities must be limited; the main key, used as a recovery might have also some identified backup plans.\
The Shamir secret sharing algorithm is a way to split a secret to multple "people" and create a backup.

### Why not "Decentralized identifiers" (DIDs)?

DID wants to eliminate the requirement of centralized authorities and gives to entities (human and non-human), the ability to control their digital identifiers without the need of external authorities.

The decentralized part of DID is the usage of blockchain technologies.

By using a decentralized organization, trust has the same issues than PGP: It should use a "web of trust" organization or a selection of authorities: [Ecosystem Trust White Paper](https://identity.foundation/publications/DecentralizingTrustInIdentitySystems.pdf).\
With the same drawbacks that we could see with SSL certificates: the creation of a business without the guarantee of security.\
While the "fediverse" (ActivityPub protocol) choose a federation organization, a fully decentralized identifier system cannot organize the trust. Even in a federated organization, each entity choose its level of trust with the other entities.

Thus, choosing a "server" with Mastodon is creating an account that can communicate with other accounts in the fediverse. Nevertheless, it is possible to create multiple accounts in different "servers" in the fediverse; there is no main authority for all the entities, each one is being independent and exchanging with the others.

## Issue/Reflection: Easy way to first contact

### Within an organization

Using the organization directory and "on behalf of" feature, the directory has the right to give contact of its members to others members (or not, see other point).

### Between organizations

If two organization directories can know each other's, it would be possible to enable the sharing "obo" (on behalf of) between organizations. The client performing a request to the other organization directory, which will confirm the identity to the other (known) directory and then share the contact directly to the client.\
It will allow the first communication between the two users and allow the creation of a direct trust (without "obo" signature).

### To an organization or someone using a contact form

The "contact form" can retrieve the sender identity with a proof that he owns it (get the sender certificate, check the signatures, ask for signature of some content for proof, etc.).

The relay, having its own identity, can send a message to the configured identity; with the content of the form and the public identity of the sender.

### Between two identities via a relay

A service (website, platform, etc.) has identities that it can share using the "on behalf of" right.\
By sending the identity to one user to another, that user can contact the first one. The receiver check that the sender identity is known and valid at the relay. If needed, the two users can create a direct trust to use a sub-identity and not stay on the sub-identity shared with the relay.\
The relay act like an organization directory.

### Between two identities, direct exchange

Without relay or contact form, the direct exchange must be easy (and as fast as possible).

With a direct exchange when it is possible to send the signed identity via another communication protocol (instant messaging, even QR code generation); it is best that the shared identity is signed with a short period of validity and with some protection: like "additional authentication data", validation code or even password depending the level of security of the communication channel.

### Supported features with the identities and sub-identities

Proof of identity - Sending confirmed identity details, certified by the authority (country, company, independant provider...)

Authentication - Using the related sub-identity keys.

Signature of content

# Concept: Personal storage

The way the message are transmitted is important, but the concept of how they are stored is also important.

"mbox" and "maildir" storages are not suitable for email features which has been add during the years and became "must have" (like the "labels" feature in gmail which helped its popularity).

With the era of databases and the progresses on storage (buckets, parquet format), the organization of the content of the personal storage must be more than just emails.

Let us see a complete different way of communication, still asynchronously but without the limitation of simply "letters" or "mails", but sharing and sending (signed) content.

Sending a "mail" is sending a file containing the text, with some attributes (a title, a thread reference, message reference), identities who are the recipients (with tags) and the all signed with the identity of the sender.\
The file is stored in the sender's personal storage and sent to the recipients. That same is stored in the recipients' personal storage but since they are not the authors; it is seen as a received document.

## Accessing a personal storage

*Define how a personal storage can be addressed (identified), moved.*\
*The constraint of anonymization for identities and aliases could be problematic.*\
*The way the sub-identities are handle must be define.*

For the entreprise use case, the personal storage of each account can be at the same place; there is not the same need of let the didentity be free to choose and move its data from one provider to another.

Even if the data can be moved, there is a need of "fixed point" to help addressing and recovery.

### Multiple personal storage

When an email client can handle multiple account in the same time, the usage of multiple personal storage have a differnet angle: the contet is "centralized" in the personal storage of the main identity.

For personal storage vision, the usage of multiplke storages should be possible. It would be possible to copy data from the other storage into the main personal storage; but when communicating with other people using a sub-identity (link to another storage), the data should be available under the other storage since it is the access point for communication.

### Relay of personal storage

A sub-identity could be attached to a relay, which make the transfer with the main personal storage. It can send the received content to the main, or retrieve from the main if needed.\
Thanks to the relay, the main storage is hidden for communication, the receivers can only see the relay and it can also help moving the personal storage.

### Personal storage mapping

*Part still in work in progress*

Mapping might not be required since the sharing keys comes with the entry-point, so if someone changes its personal storage he should be able to contact everyone to inform the change.\
*Just like changing the phone number, the full address book is still available in the phone.*

The mapping in not an identity directory; it should help knowing what server contact to delivery the content.\
When saving a contact, the identity details is stored (unique identifies for identity and communication channel, public cryptographic keys, private key for private communication, etc.), the "entry point" for the contact is also stored. If the identity change its provider, the communication should still be possible, just like resolving a server hosting for a website using DNS.

## Files and attachments

When sending a "mail" with attachments, each parts are stored in the personal storage. The "mail" reference the file as attachment with its name, the file size, a hash and other elements to identify it but also to avoid the deduplication of the content in the personal storage.

Sending a "mail" can be in different ways: transferring the full content or a "notification" for delivery.
If the "mail" is big, if it is a "newsletter", etc.; the notification for delivery is interesting because the receiver knows that a message is waiting and can download it later. For big emails, it avoids the transfer of content, the receiver choose when and if he want it. For newsletter, the receiver download the content when (and if) he want to read it and the sender can be notified when and which receivers are getting the content. For personalized newsletter, it can also avoid the generation of all content, the part in "notification" will then generated on the fly when needed.

Therefore, a "notification" mode allows a kind of confirmation of reception (reading); it uses less bandwidth and can authorize on-the-fly generation content. A notification should have a date of expiration, when the affiliated content will not be guarantee.

Splitting the attachments as referenced files avoid duplication. If the receiver already have the file (same size, hash, etc), it can avoid the download. In case of transfer of file, the sender must retrieve the file in its personal storage if he want to re-send it. An attached file gives the permission of download for the receiver for a specific duration, after that duration the "token" is expired and it is not possible to download it afterwards. The "token" cannot be use by other identity than the one identified by the token.

Sending a just file to another identity is sending a "mail" with embedded content, describing the attachment content.

## Personal storage and multiple identities

*Part, still in work in progress*

If we considers the "redirection" as a personal storage, which receive and forward content, the "alias" is the possibility to handle multiple identities within the same personal storage.\
The main identity owns the alias; unlocking the main allows to unwrap the aliases and access their content.

Content between the main identity and its alias must be in different "spaces" within the storage; the main identity can access all but an alias must not be able to access (share, forward, etc.) any element from its main identity which could result a leak of the main identity.\
On the same principal, the main identity should not send content from an alias, otherwise the alias would be compromised.

To be able to use multiple identity for one personal storage, an identity should be represent by a "unique identifier" that is not "personal". The way to contact an identity should not contains details of that identity and, since a sub-identity can be created and destroyed easily.

## Personal storage and content management

Content (files) in the personal storage must be organized and separated regarding the differnt identities. The personal storage must also have a private section to store data only for the owner, such as the contacts.

The usage of a kind of database could be useful to find in content and organize it, like handling "tags" (or "labels"), store bloom filters to speed up searchs, centralized in the storage to improve performances.
