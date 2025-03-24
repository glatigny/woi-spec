# Social Infrastructure - JS Testing

Some tests made between January 2021 and August 2023 to create a cryptographic identity, add relations and exchange messages.\
The goal was to be fully standalone in a web browser, using the less libs as possible and JavaScript cryptographic functions.

No TypeScript (no transpilation), usage of JS private functions/members to secure (as possible) the keys.

That small project was the starting point of reflexions regarding the `web of identities`.

## JavaScript Testing structure

The project uses `protobuf` for message serialization.\
Since it is based on Browser cryptographic API, the choosen algorithms are: `AES-GCM`, `AES-KM` and Eliptic curves (`P-256`, `P-384`, `P-512`).

The users creates its profile, which stores its own keys and contacts (with the communication keys).\
All is perform within the browser, offline. So the creation of a communication channel, the exchange of keys and the creation of message is fully *offline* and must use others communication systems.
