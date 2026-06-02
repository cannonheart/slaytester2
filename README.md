# Slaytester 2

A player writing a commend with feedback is good, but seeing a player spectacularly fail to find the end of the level is enlightening.

Slaytester lets players record themselves playing your webgame with the click of a button.  

You insert a single line of html into your game, and Slaytester takes it from there.

Slaytester records (after clearly asking for consent):
- the games canvas element
- the games audio
- the players mic (if the player wants to) (and if you have enabled it)

This is useful for:
- when you want people to record themselves playing your game, but without the hassle of setting up OBS
- when you want randos to be able to easily comment on their mic as they play the game
- checking if your update fixed that puzzle everyone had trouble with


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
Before you start hacking away, please open an issue to discuss what you want to do first. This is to avoid you spending 2 weeks implementing something and then me rejecting the PR because I don't feel your design fits the project.

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

## Tested with
So far Slaytesters recorder has been tested with:
- Pico8: works wonderfully!

## The name
Slaytester 2 is the third (or fourth maybe, can't remember) iteration of slaytester. There is also Slaytester, slaytester-old and the yanky draw call solution I made before that.

There might be a blog post about it sometime: [https://cannonheart.com/](https://cannonheart.com/)
