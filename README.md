<p align="center">
  <img src="http://i.imgur.com/XYtMrPw.png">
</p>

# Pebble Push
An Amazon Alexa skill that pushes reminders directly to your Pebble Smartwatch Timeline.


## Inspiration 
My Pebble Time has been glued to my wrist since the day I got it from Kickstarter and haven't regretted the purchase since (though it is sad to see the company closing its doors as it did). Until push notifications come to developers for Alexa, I saw the reminder system useless. And with no similar functionality on the Pebble, there was a large lack across the board and Pebble Push was designed to fill this hole.

## What it does
Pebble Push has the ability to send reminders straight to your Pebble Timeline without the need for extra apps on your phone or accounts on various websites. Simply provide Alexa with the date and time of your reminder, or just how many hours in advance you'd like to be reminded and you'll see the reminder in your timeline within 15 minutes. Setup instructions can be accessed on your Alexa App, or just keep reading.

## How I built it
Pebble Push utilizes the Pebble Web API to send pins directly to your timeline. This removes the middle man and gives you complete control on the timing and structure of the reminder. The user information is stored in a secure database that the Amazon Lambda function communicates with via its REST API.

## What's next for Pebble Push
I hope to build upon this system in the future to maybe streamline the setup process a little more, implementing more reminder options, and possible branching out into more services such as Google Calendar. However as of now, I find this skill incredibly usefull and am using it nearly every day.

## Setup instructions
Welcome to PebblePush! In a few short minutes you will be ready to send reminders directly to your watch! Just follow these short steps:

1)In the Pebble Appstore, download the 'Timeline Token' app. This app is required and must remain installed. Use this to get your Timeline Token

2)Your Alexa ID can be found in the card within the Alexa App. This and your Timeline Token from Step 2 will be used in Step 3

3)Click the 'Link Account' button in your Alexa App and insert these values. If you don't see this card, please say 'ask Pebble Push to link account'. You can also do this step by visiting www.pebblepush.me

You are done! **NOTE:** Pins can take some time to show up in your timeline. Do not rely on reminders any closer than 15min as Pebble cannot guarentee they will appear
