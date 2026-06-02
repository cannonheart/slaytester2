# Slaytester 2

It's kinda hard to get good feedback out of players unless you see what's happening on screen. A comment is good, but seeing them spectacularly misunderstand which button to press is enlightening in a different way. 

Slaytester makes it easier for players to give you good feedback, by letting them record themselves playing your game with the click of a single button.

This is useful for:
- gamejam games where you want feedback from the randos playing your game
- when you want to do recorded playtesting without having to contact a fuckton of people and ask them to set up OBS
- when you release a new version of your game and want to see if you change fix an issue

## Installation
This guide expects you to have a basic understanding of web stuff. If you don't, please send me a message and I'll help you set it up.
- install deno on your server
- download this repo (either manually or through git clone)
- create a .env file in the project root and write `ADMIN_TOKEN=yourpasswordhere`
- start the server (`cd` into `src`, run `deno task start`)
- the server now runs on port `5147`
- set up a cron job that starts slaytester on server reboot
- use something like a cloudflare tunnel, or a reverse proxy to expose the port to the internet behind a domain you own

## Running a playtest
- log in using your `ADMIN_TOKEN`
- click the create playtest button
- click on the `view` button for the playtest you created
- copy the embed code
- paste the embed code AT THE TOP OF YOUR HEAD ELEMENT (very important) in your `index.html` file
- try running the game, see if the magical playtest popup comes up
- profit

## Developing
Before you start hacking away, please open an issue to discuss what you want to do first. This is so we avoid you spending 2 weeks implementing something and then me sayin "no", because I don't feel your design matches what already is, or the general goals of the project.

If you want to hack away on your own fork, feel free! 

But basically the process is:
- git clone the repo
- cd into the src directory
- deno task start to run the server
- cd into the src-recorder
- deno task build to rebuild the recorder (automatically places it in the static material)

The stack is:
- deno for backend
- fresh for routing + serving and whatnot
- tailwind for css styling
- esbuild for smushing the recorder into a single js file
- actually quite reasonable, all things considered

## The name
Slaytester 2 is the third (or fourth maybe, can't remember) iteration of slaytester. There is also Slaytester, slaytester-old and the yanky draw call solution I made before that.

There might be a blog post about it sometime: [https://cannonheart.com/](https://cannonheart.com/)
