# Classis Botrealis

[![Add To Your Server](https://img.shields.io/badge/Add%20to%20Your%20Server-5865F2?style=for-the-badge&logo=discord&logoColor=white)](https://discord.com/oauth2/authorize?client_id=1396088730938245151&permissions=311922002944&scope=bot%20applications.commands)

Welcome to the Classis Botrealis codebase. This bot is mainly a collection of experimental features hacked on top of the Bitcraft SpacetimeDB backend.

While you're welcome to self-host the project, I'm mainly making this code available as a reference for others to help demystify working with Bitcraft's backend. If you'd like to use the bot, please just invite it to your server!

## Getting started

- Generate bindings
  - `pnpm bitcraft:dump-schema` to extract the schema in JSON format
  - `pnpm bitcraft:generate-bindings` to use that schema to generate bindings required for our code to interact with the SpacetimeDB backend
- Get bitcraft credentials
  - `pnpm bitcraft:get-access-code` to send an access code to your email
  - `pnpm bitcraft:get-auth-token` to exchange the access code for an auth token once you've added it to your config
- `pnpm db:temp` to spin up a migrated postgres container
- `pnpm dev` to run the bot

## Contributions

In general I welcome contributions. However, please reach out BEFORE spending time building a feature so we can discuss it!

I do also expect features to meet certain minimum standards of unit/integration test coverage before they can be included.

Please refer to `CONTRIBUTING.md` for the CLA.

## Acknowledgements

Huge shoutout to [Wiz](https://github.com/wizjany) and the other good folks over in the BitMiners server. I'm standing on the shoulders of their hard work and this would have been so much more tedious to build without them.
