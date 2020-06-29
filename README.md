# Gate-Keeper for the Mixed Reality Extension SDK

This is a virtual bouncer which you can embed into an AltspaceVR virtual world. Users arriving by the time you set
will be allowed to enter. Users arriving later will be allowed to enter if they had entered previously.
Otherwise, they will be presented with a barrier, and a message explaining why they aren't allowed to enter.
This MRE is written using the [Mixed Reality
Extension SDK](https://github.com/Microsoft/mixed-reality-extension-sdk).

## Prerequisites

Node.js 14 with Typescript support.

## How to Build and Run

* Clone the repository.
* Change to the top-level directory of the repository.
* If you want to access the MRE by a hostname other than _localhost_,
create a _.env_ file to define your desired hostname (see _.env.example_).
Note, that some hosting MRE SDK can detect correctly the settings used
by some popular hosting environments.
* `npm install` This will install all dependent packages. (and will do very
little if there are no changes).
* `npm run build` This should not report any errors.
* `npm start` This should print "INF: Multi-peer Adapter listening on..."

In AltspaceVR:

* Go to your personal home
* Make sure you are signed in properly, not a guest
* Activate the Space Editor (only available if you indicate you want to participate in the Early Access Program in your AltspaceVR settings)
* Click Basics group
* Click on SDKApp
* For the URL field, enter `ws://localhost:3901`. If you've configured a different hostname, use that instead.
* Click Confirm
* If the app doesn't seem to load, click on the gear icon next the MRE object
in to the present objects list, and make sure "Is Playing" is checked.
* After the app has been placed, you will see the MRE Anchor (the white box
with red/green/blue spikes on it), rendering on top of the MRE. You can use the
anchor to move the MRE around. To hide the anchor, uncheck "Edit Mode".

### Behavior

Users who arrive before the configured deadline are presented with a greeting welcoming them.
Users who had already been inside are presented with a slightly modified greeting, which
welcomes them back. Users arriving after the deadline are presented with a barrier, and
a message explaining why they aren't allowed to enter, and a suggestion for registering
for upcoming events.

The list of users who had entered is retained for invocations of the MRE using the same
session ID.

### Configuration

The initial count and the increment applied to the counter when clicked can both be customized.
This is done using query parameters in the URL.

* _ed_ - The entrance deadline, as an ISO 8601 timestamp, including offset from UTC.
* _c_  - Specify the colour of the barrier as a hex string, omitting the _#_. Either an RGBA string
can be used, in which case the alpha channel gives the opacity, or a plain RGB string, in which case
the barrier is fully opaque. If no colour is specified, the barrier will be a metallic gray.

Example: Set the deadline to a time in UTC+1, and the colour of the barrier to a translucent burgundy:
`ws://localhost:3901?ed=2020-06-14T10:30:00+01&c=66000140`

Example: Run the MRE on a server with SSL. Specify a deadline in UTC-5, and use the default barrier colour:

`wss://my.ssl.server.io/?ed=2020-06-28T16:00:00-05`

### Hosting in the Cloud

This MRE is built using Node.JS 14. Check out [DEPLOYING.md](https://github.com/Microsoft/mixed-reality-extension-sdk/blob/master/DEPLOYING.md) in the SDK repo for more suggestions.

In particular, deployment to a Heroku Dyno is well supported. To deploy there, set-up your project
to use Node-JS and set the environment variable BASE_URL to be your Heroku https URL.
Use the corresponding _wss://_ URL to access the MRE in the world. Everything else should
be handled automatically by Heroku.
