The repo shows how to implement CMU OAuth (sign-in with CMU Account) in your own web app using Next.js + TypeScript. We get CMU basic info (like student name, student id,..) after signing in then we use this information to create our own session.

[More information about CMU OAuth](https://docs.google.com/document/d/1N2jqPHwgKD1hmspXBlEfoHEw6Sj2m-co2Jx_lRQTPwY/edit?usp=sharing)

## Please do the following steps before you start

1. Run `npm install` command in your terminal.
2. Copy your `CLIENT ID` and `CLIENT SECRET` to the `.env` file.
3. Update `NEXT_PUBLIC_CMU_OAUTH_URL` variable in the `.env` file.
4. Run `npm run dev` command in your terminal.

## Warning

This repo include .env file to kickstart required variables for you. But in practice, you should not include .env in repository at all!





