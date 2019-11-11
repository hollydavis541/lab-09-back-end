# Code 301 Lab 09 - Advanced Topics  

**Author**: Holly Davis and Lindsay Peltier  
**Version**: 1.4.0
<!-- (increment the patch/fix version number if you make more commits past your first submission) -->

## Overview
Create a node.js server that connects to APIs that provide weather, restaurant, movie, and trail information to the [City Explorer site](city-explorer-code301.netlify.com). 

<!-- Provide a high level overview of what this application is and why you are building it, beyond the fact that it's an assignment for this class. (i.e. What's your problem domain?) -->

## Getting Started
<!-- What are the steps that a user must take in order to build this app on their own machine and get it running? -->
1. Fork this repository
2. Clone it to your computer
3. In your command line: $ touch .env
4. Add your API keys and database url to the .env file
5. Confirm that node is installed: $ node -v (if not installed, do so)
6. To start your server: $ nodemon
7. Go to city-explorer-code301.netlify.com and enter "http://localhost:3000" in the field. Search for a city and you should see the location and weather information. 

## Architecture
<!-- Provide a detailed description of the application design. What technologies (languages, libraries, etc) you're using, and any other relevant design information. -->

This is a Node.js server that uses express, dotenv, and cors packages. The server currently references two json data files in order to provide information to the client. 

## Change Log

11-08-2019 09:30 AM - movie database API working

11-08-2019 11:30 AM - yelp database API connection working, but not yet rendering to page

11-09-2019 11:20 AM - trails database API working

11-09-2019 03:30 PM - yelp data now rendering to page

11-09-2019 06:00 PM - js files modularized

<!-- Use this area to document the iterative changes made to your application as each feature is successfully implemented. Use time stamps. Here's an examples:

01-01-2001 4:59pm - Application now has a fully-functional express server, with a GET route for the location resource.-->

## Credits and Collaborations
<!-- Give credit (and a link) to other people or resources that helped you build this application. -->


Number and name of feature: Feature #1 Movies  
Estimate of time needed to complete: 90 minutes  
Start time: 08:20 AM  
Finish time: 09:30 AM  
Actual time needed to complete: 70 minutes  

Number and name of feature: Feature #2 Yelp  
Estimate of time needed to complete: 90 minutes  
Start time: 09:30 AM  
Finish time: 11:30 AM  
Actual time needed to complete: 120 minutes (to get data showing in console, additional time to debug not rendering to page)  

Number and name of feature: Feature #3 Modularize  
Estimate of time needed to complete: 90 minutes  
Start time: 04:30 PM  
Finish time: 06:00 PM  
Actual time needed to complete: 90 minutes  

Number and name of feature: Feature #4 Trails  
Estimate of time needed to complete: 60 minutes  
Start time: 11:00 AM  
Finish time: 11:30 AM  
Actual time needed to complete: 20 minutes  