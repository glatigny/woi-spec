# Introduction

The email ecosystem evolved for the past decades but has not receive a real modification in its structure. The usage of email has change, adding bricks and tricks instead of being adding in a real standard. Security issues and Spam; the various drawbacks of emails need extra software and protocols to try to slow down the issue, without really solving it.

That document tries to list what is wrong with emails, regarding the protocols, the ecosystem and the usages.

The document is the expression of a personal view and do not cover every aspects.
It tries to start thinking about what could email could become, by changing old protocol designs or very bad usage of the email by client software.

# Technology of emails

## The protocols behind the emails

Email bases on three main protocol for exchange:
* SMTP (1981) - Simple Message Transfer Protocol
* POP3 (1984, 1985, 1988) - Post Office Protocol
* IMAP4 (1986, 1988, 1991, 1996) - Internet Message Access Protocol

To try to solve some issues, other protocols are used:
* MIME - Multipurpose Internet Mail Extensions
* S/MIME - Secure/Multipurpose Internet Mail Extensions
* DKIM - Domain Key Identified Mail
* DMARC - Domain-base Message Authentication Reporting and Conformance
* SPF - Sender Policy Framework
* SASL - Simple Authentication and Security Layer
* DNSBL / RBL - Domain Name System Blocklist / Real-time Blackhole List

To propose a new approach of one brick:
* JMAP (2019) - JSON Meta Application Protocol - IMAP

## Concepts of delivery

Email has a strong analogy with physical mails, but we can also see the analogy with "parcels" when having heavy emails (with big attachments).

We see the email like the traditional "drop off", when the email is stored in the user mailbox.\
When you have an important letter or that the parcel is too big for your mailbox, the content is stored in a "relay point" with acknowledge of receipt. It allows the sender to be sure that you received the message and allow sending heavy parcels.

## Topology

Internet has been design as a decentralized system because each domain defines the list of servers for that domain.\
Even if the security was not take into consideration and some unsecured actions were possible, it is important to keep in mind that the first idea was decentralized.

With the loss of protocols and the growth of services, the World Wide Web changed into a centralized topology.\
Even if email is still decentralized, cloud providers and other mail services creates a concentration for email hosting (and email sending); that concentration creates sometimes some security issues related to the decentralized initial conception.

If we compare with physical mail, the concentration of services (google mail, outlook, proton mail, etc.) is like renting a "post office box"; you need to go to the post office to read and send your mails, the price depends on the size of your box.\
However, in physical mail, your mailbox is at your house; everybody can drop a mail if they are physically there, otherwise they pay a fee and drop the letter in a Post box.

## Simple Protocols

The SMTP protocol self-defines as "simple". It was possible to write an email directly via a "telnet" connection, which was fun and in a way, useful when SMTP clients did not exists.

Due to that simple protocol, we now have many drawbacks, like "spam", "phishing", etc.\
Like physical mails, it is possible to send a letter to someone without adding sender details (except the stamp of the post office where the letter has been deposit), or just faking an identity.\
While in traditional mail, it is not simple (or free) to send thousands (or millions) letters at the "same time", the electronic mail does not have the same kind of limitation.

### Email headers

Each servers that handle the email during its transit modify the email headers.

However, there is no integrity and it is not possible to be sure of which server added which header.\
Even if a server must add the details of the previous server in the headers, the security is not enough.

Using the headers to store "spam detection" result, or DKIM/SPF details, generate some unwanted side effects (such as invalid signatures with redirects). In a way, headers are useful for transit (even if has various flaws) but become less interesting once the email has been "delivered".\
For physical mail, the letter is in an envelope (which provide some kind of integrity) and that envelope is generally send to trash once opened.

## Frugality, Spam and costs

Spam is easy due to the protocol and the lack of trust. The quantity of spam sent each day is huge and it costs a lot of energy (and bandwidth).

It costs energy to send all these emails and it costs more energy to receive and check that the email is a spam or not. Every email need to be check, even legitimates ones.

SMTP legacy implies that emails are still send in 7bit encoding, Base64; it makes the messages heavier by adding overhead. The reply system also add a lot of content that could be avoid in most cases.

In term of storage, email clients also store a copy of sent mails in a dedicated folder.\
Despite the classification issues of that folder, it is also a deduplication of the storage usage. In order to keep the history of the communication, everything is duplicate (including the history of answers making every reply bigger than the previous).

## Privacy with S/MIME and PGP

Many people already wrote about PGP and S/MIME better than me: 
* [What's the matter with PGP? - A Few Thoughts on Cryptographic Engineering](https://blog.cryptographyengineering.com/2014/08/13/whats-matter-with-pgp/)
* [The PGP Problem | Latacora](https://www.latacora.com/blog/2019/07/16/the-pgp-problem/)
* [Replace PGP With an HTTPS Form / I'm giving up on PGP](https://words.filippo.io/giving-up-on-long-term-pgp/)
* [Efail : Breaking S/MIME and OpenGPG Email Encryption (pdf)](https://www.usenix.org/system/files/conference/usenixsecurity18/sec18-poddebniak.pdf)

The cryptographic algorithms are old and weak; the implementations are unfriendly... Common people cannot use S/MIME and PGP on daily basis. Moreover, solutions meant to be more secure, such as "Proton Mail" are not "open" so they propose an integration with "classical" email using S/MIME and PGP.

The PGP "Web Of Trust" system has an interesting concept but with its drawbacks. Like forcing to use "long term" keys, no information regarding the level of trust and no revocation.
PGP is a "tool" which do too much and which is, at the end, not friendly. It requires strict rules to do it right, like "Debian" mentioned by Filippo.

# Usage of emails

## Traditional email (between human people)

### What is a classical communication?

"Email" as "electronic mail" could be like a traditional letter. An asynchronous communication between people, following a formalism.

### Threads / Replying

An email have a "subject", despite that the subject is a public field, that subject defines what a thread is. When replying (or transfer), email clients prefix it with "Re" or "Tr" which makes the subject difficult to handle.

A reply also add the content of previous email (so emails). It might be useful when performing a "transfer" but for classical thread communication, the email grow in size to duplicate the content. There is no proof that the previous content has not be altered.\
Be able to mention previous part is interesting but should be as a link to the previous message, with start and end points.

"Threads" is an important concept of emails. Because you can have several conversations with the same person (or persons) in the same time for different subjects. "Instant messaging" tools (they are not defined protocols) like "Slack", "Discord", "Matrix" or "Google Meet" introduce the concept of "channel" and "internal threads within a channel" (you can reply to a message a create a new conversation within the conversation). Others like "Teams" have the concept of "group/conversation" where people can easily create a new conversation for a specific subject with defined people.

### Redirection or Alias

It is common to aggregate multiple email addresses into one single account.\
That can be achieve thanks to redirections, alias or even with programs which collect emails.

### Confirmation of receipt or reading

Just like physical mail (and parcel), it is possible to ask for a confirmation of receipt. Nevertheless, the analogy stops there.

The confirmation of receipt is a feature that allow knowing if/when the recipient’s mailbox have receive the email. Strange feature since the non-delivery result of a notification email by the sender server; a reason why that feature is not really used.

The confirmation of reading is a feature added on top of the mail format. The mail client should send an email to the sender when the email is open. Not all of clients support the feature and for the ones with it, they generally ask the user if they want to send the reading confirmation.

### Sending files (Parcels)

Sending files is a very common usage of emails. There are some size restrictions, depending how the hosting server is configured (limitation on email size) and the size of the mailbox.

If we talk about "big files", we can see a big difference between email and physical mail. When we ship a parcel, if it does not fit in the recipient mailbox, he receives a note to be able to take out the parcel at the closest post office (to summarize).

In emails, the file is stored as attachment in the "sent mail" for the sender, and the mail will transit though the various servers to the recipient mailbox. But if that mailbox is full, the message is stalled by a server which will try to deliver the email for a configured period of time.

Most of mail clients do not allow deleting attachments in email (without deleting the entire email).

Some file transfer services allows uploading files and sending a notification to emails so they can download the files (during a defined period). Other providers proposes to upload the file into a drive and includes a link in the email to let the recipient download it. The file stays in the sender drive storage who need to delete it.

### Email formalism and instant messaging

The subject is a formalism used by emails to get a context, a summary and a way to retrieve it in a listing display of emails. The subject is "fixed" for a thread, changing the subject generally mean to create a new thread (for email clients).

Emails are "electronic mails", letters. They have the same kind of "rules" which are more or less followed. Sometimes, an email can have an empty subject, or the entire content of the email within the subject. The arrival of instant messaging in the world changed how emails are used and sometimes, the same communication methods of instant messaging are used in emails: very short message, no greetings, and many replies in a short period for different points.

Some instant messaging tools are using feature that we have for a long time in emails (see threads / replying); however, we can find a lot of different tools (or protocols for the one who are "open") and since they are oriented on instantaneity (synchronous), they follow conversation behaviors and they are centralized (even when they are federated).\
"Instant messaging" has their own identity structure: centralized (unique identifier for the platform) or federated (an unique identifier and a hosting).

By being asynchronous, email is meant to be slower than instant messaging, so the mails generally (not for all cases) contains more content since there is no direct (synchronous) communication/reactions.

It is not possible to use instant messaging for all email cases (newsletters, notifications, shared boxes, etc.). The fact that content is stored/owned by each member means that the content is more volatile; it can be deleted at any moment, but it can also be "archived".

Mail can contain more important content than instant messaging, messages that user might want to keep for a long time.

"Instant messaging" systems do not have the concept of sub-identities; they meant to work only in their environment, for their direct communication purpose. Some have "bridges" (plugins) to communicate using other tools or protocols.
The concept of "alias" to split (organize) the communication and the shared data (identity details) is not present.

* [RFC 9420: The Messaging Layer Security (MLS) Protocol](https://www.rfc-editor.org/rfc/rfc9420.html)
* [Matrix.org - About Matrix](https://matrix.org/foundation/about/)
* [About - Mastodon](https://joinmastodon.org/about)

## Mailing-list / Groups

In current world, the mailing list is a special usage of emails, with specific subject or prefix in the email address to perform actions such as request for subscription or the un-subscription.

For the common usage, the mailing-list address receive a message and forward it to every registered emails. The forward is done without subject modification and it keeps the sender and receivers intact.

Only members of the group can send messages to the list. Some admins manages the subscriptions and every member should have the right to unsubscribe.\
Subscription can be done via an invitation (from admin) or via a request from a user.

## Shared boxes

A shared box is an address where several users can access.
They can all read and send messages via the shared box, the admin is the only person who can send an invite and manage permissions.

## Automatic usage of emails: Newsletters

*Personalized... Or not.*

In the ideal world, people subscribe to a newsletter in order to receive (more or less) frequent content. It can be a generic newsletter when every subscriber receive the exact same content; or it could be some personalized content.

The personalized content can be simply the name of the receiver or simple content (like the value of points/credits for fidelity newsletters). Or it can be some selected "items" (products, articles, etc.) based on the profile.

Newsletters must include a link to unsubscribe; more or less integrated with email clients.

Clearly, many newsletter subscriptions are done without the consent of the receiver.\
And if the receiver decide to click on "unsubscribe", the sender has the information that the mail has been read so the email address is "alive" (and could be sold).

Newsletter content can have an expiration date. After a period of time, the content of the email is outdated. Receiver might want to keep the email in his "inbox" as a reminder, or trash it directly after reading it (if not interested) but generally not keep it forever.

## Notifications

Notifications is another automatic usage of emails, like the newsletters, the notifications are mainly "do not reply" addresses; a program is sending automatic messages but not meant to receive them.

> You received a message in our platform

The notifications are short messages with no important information in the body of the mail.\
Its goal is to inform the user of the event, which can be more or less urgent/important.

> New connection from ...

When connecting to a platform or service, for security purpose, a notification can be send so the user could be alerted if someone else log-in.\
Since some platforms need a "proof of identity", that notification can be useless and if the "proof of identity" was using an email.

## Automatic replies

We can find two kinds of automatic replies. It depends if the email is stored or not in the user.\
When the message is delivered but a reply can be emit:
* Leave of absence notification (start & end date, another email for urgency).
* notification of message received (this should not exists anymore)

When the message is not delivered due to an "issue":
* Address is archived
* Mailbox full

In enterprises, because the email client is link to the company directory, it is possible to know the leave of absence (or mailbox full, etc.) before sending the email. Such kind of feature is interesting for a new system, as long as the information is available only for "authorized" accounts.

Clearly, when a newsletter is sent (or similar), there is no need to send a reply for the leave of absence. However, an information that the address is archived or the mailbox is full is interesting because it might trigger actions (unsubscribe, etc.).

## Embedded content

### Events / Calendar

Contains specific meta-data; it should be possible to find other needs with other meta-data.
* Meeting - Date + Duration + Locations (physical place, link for online «room»)
* Event - Date + Location + (opt) duration.
  * Include reservations (movie, concert, restaurant, etc.)
* Reminder
* Travel information, Hotel.

### Order / Invoices / Delivery

From the order creation to the invoice, with the delivery steps.

### Others...

Polls, tasks.

Files.

## Contact forms

In websites, "contact forms" (or ways to contact the owner/support) are common.

Current usage have serious drawbacks since the user can enter any email address and can ask for a copy of the message. There is no proof that the email address is "valid" which can result of spam (in both ways).

Contact forms can generate "impersonate" the user so the owner/support/etc. just need to reply to the message to contact him back. That flow is incompatible with signature (and security in general).

One solution is to let the user provide some kind of "signed token" in order to prove his identity and allow the "website" send the email to the owner/support and the user/client.

## Proof of "identity"

We can see use cases where emails are used as proof of identity, or more precisely, as proof that the user has access to his email address. It can be during the registration (proof that the given email is legitimate) or as multifactor authentication system.

Some works are in progress toward W3C with "DID" (Digital Identity).

### Confirmation link

While performing a registration, a confirmation link is send to confirm your email address so it can contact you in the future.

### Confirmation code / MFA

While connecting to a service, email (previously confirmed) is use to perform a multi-factor authentication.

## Other usages

### Open-source development

For some open-sources projects, such as the Linux Kernel, email (using mailing lists) is a common usage for patch submission and conversation about them. The format of the emails follow a specific pattern, including "diff3" content, quotes, comments, etc.

# Changes in the world

* Security of people
  * Trust / Authentication (against Spam & Phishing)
  * Privacy (Even with encryption/encapsulation : Headers, Subject are still clear)
  * Forward secrecy
  * Confirmation of reception
  * Multi-domains / Redirections
* Entreprise needs
  * Internal and external communication
  * Level of confidentiality
* Performances
  * Improve frugality (binary, encoding, compression, etc.)
* Features
  * Multi-devices
  * Labels/Tags (in the inbox)
  * Postpone sending

## Enterprise needs

Emails in enterprises do not have the same rules than personal emails.\
While users really do not want their email provider to be able to access in any way their communications, the enterprise emails might want some Recovery tools and some security rules.

Such as the tag for the level of confidentiality off the message.

While traditional email has "to", "cc" and "cci" fields; they do not feet anymore to the needs.\
"Carbon Copy Invisible (CCI)" is a problem for encrypted messages if its uses the traditional email flow: if the server itself dispatch the same message to the receivers, an encrypted content must then include access for the CCI receivers; which means that they won't be so "invisible" at the end.

If we think about business and project management, the Responsibility Assignment Matrix implies roles: Responsible, Accountable, Consulted, And Informed. While it is not the only organization matrix, the fact that there is roles for receivers means that "to/cc" is not flexible enough.

*"@all" and other lists with "reply all" issue.*\
*Sending emails with too many recipients.*

## Real-time and multi-devices

While checking his emails was like checking his mails and need a user action, that need changed since we are always connected. With all the instant-messaging systems, we prefer having an email system which send us a "push notification" when new email is coming.

IMAP includes an "IDLE" command, not fully supported by clients or servers.

POP3 implies that the client download the emails from the server. Like a physical mailbox, the server limits the storage size so emails should not stay in the mailbox.\
With the multi-devices needs, it needs a way to store messages for long-term but also to avoid keeping "junk" emails for too long.

For instant messaging protocols providing "end-to-end" encryption, such as Signal or iMessage, the multi-device feature requires the usage of multi-key encryption. To summary it, each message is encrypted for each registered device.

## Presentation and HTML

While the first emails where raw text, the usage of "html" attachments changed the default displaying content. Because HTML can embedded lot of resources (internal or external), it is not considered as a safe support for emails.

Clients must add security layers to filter the HTML, remove the JavaScript, block and proxy the external resources, analyze internal resources.\
Email clients do not support HTML the same way, especially for tables and CSS.

The rendering is not the only issue: HTML also add overhead in the messages and the email client generally send the content in both plain text and HTML and that HTML content generated by some clients can be "huge", by adding many unnecessary tags.

Back in the days, tweaking the font was "popular" but the receiver might not have the correct font so the display was not right. Email is not a webpage so external content should be avoid; even if newsletters are using more and more external images so they can have the rendering they want for most email clients. It is also a way to track who is opening the email but it requires storing the image for a very long time.

## Email body signatures

Signatures was a little feature to help the user by adding always the same content at the end of messages he was writing. However, it evolved, becoming in HTML, adding images (as attachment or embedded), more and more content such as messages asking to not print the email and lot of other weird usages.

Companies can set templates for signatures for all employees, linking it with the internal directory to display the contacts, addresses, job position, etc.

These signatures are include in every messages as part of the email body; which duplicate the signature content with replies. Sometimes adding signatures’ images multiples times as attachment (and worst if embedded image).

# Introduce new concepts

[See concepts](introduce-new-concepts.md)
