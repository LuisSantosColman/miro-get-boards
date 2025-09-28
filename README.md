# Miro Board Classification Script (Node.js)

This repository contains scripts to bulk update the classification label for "unclassified" boards in JavaScript (Node.js).

## Requirements

* [NodeJS 16.x or higher installed](https://nodejs.org/en/download/)
* You must be a __Company Admin__ in your Miro account, or at least the user generating the token must be a __Company Admin__ in your Miro account (see steps 3 to 5)
* You must have the role __Content Admin__ assigned, or at least the user generating the token must have the role __Content Admin__ assigned (see step 4 below)

__Note__: If the person running the script is not a __Company Admin__ with the __Content Admin__ role in your organization's Miro account, please have a __Company Admin__ with the __Content Admin__ role in your Miro account follow the __steps 3 to 5__. Once the token has been created, the Miro __Company Admin__ with the __Content Admin__ role can provide the token to the user who will run the scripts to execute the changes.

## Step 1. Install Node.js

1.1. If you already have Node.js installed in your local machine, you may skip this step.

1.2. If you do not have Node.js installed, proceed to download it [here](https://nodejs.org/en/download/) and proceed to install Node with the downloaded file. (Feel free to use the command line to download and install Node if preferred).

## Step 2. Create directory for your script files

2.1. In your local machine create a folder in the desired location where you will store the files within this repository.

2.2. Download this repository as .zip and extract the files within into the directory created, or clone this repository into the desired location in your local machine.

## Step 3. Create a Developer Team in Miro

3.1. If you already have a Miro Developer Team, you may skip this step.

3.2. If you do not have yet a Miro Developer Team, please visit this [Miro Help](https://help.miro.com/hc/en-us/articles/4766759572114-Enterprise-Developer-teams) page and follow the instructions within the article to create an Enterprise Developer Team for your Miro Enterprise Account.

## Step 4. Make sure you have the "Content Admin" Role in your Miro Enterprise Account

4.1. To be able to check all Boards within your Miro Enterprise Account (including Boards you have not been invited to) you need to have the role "Content Admin" assigned. To check this, proceed as explained in this [Miro Help](https://help.miro.com/hc/en-us/articles/360017571194-Roles-in-Miro#h_01HQ8889WQP2N8PCPRHTPTDNZR) article.

4.2. If you do not appear within the users assigned to the "Content Admin" role, proceed to add yourself to the "Content Admin" users as explained in the Help article mentioned in step 4.1.

## Step 5. Create a Miro App to get a REST API Token

5.1. To create a new application on your Miro Enterprise account using the Enterprise Developer team, navigate to __[Profile settings](https://help.miro.com/hc/en-us/articles/4408879513874-Profile-settings) > Your apps__, agree to the terms and conditions, and click on __+ Create new app__.

<img src="https://miro-org.s3.eu-central-1.amazonaws.com/board_classification/Create_new_app.png" alt="Accept app terms screenshot" width="502" />

5.2. Insert the desired app name (e.g. __Get Boards Script__), select your Developer team for the application and click on __Create app__.

<img src="https://miro-org.s3.eu-central-1.amazonaws.com/board_classification/create_new_app-img.jpg" alt="Create app screenshot" width="502" />

5.3. On the app page, scroll down and select the following scopes of access to grant to your REST API token:<br><br>
  `boards:read`<br>
  `organizations:read`<br>
  `organizations:teams:read`<br>

<img src="https://miro-org.s3.eu-central-1.amazonaws.com/board_classification/get-boards-app-scopes.png" width="700" />

5.4. Click on __Install app and get OAuth token__

<img src="https://miro-org.s3.eu-central-1.amazonaws.com/board_classification/install_and_get_token_screenshot1.png" alt="Install and and get token screenshot" width="700" />

5.5. Select any team within your Enteprise account, the token will apply for the entire account based on the scopes set on step 5.3. and click on __Add__

<img src="https://miro-org.s3.eu-central-1.amazonaws.com/board_classification/select_team_screenshot.png" alt="Install and and get token screenshot" width="502" />

5.6. You will see the __REST API token__. Copy this token and store it in a secure place. You will need it when running the scripts.

<img src="https://miro-org.s3.eu-central-1.amazonaws.com/board_classification/get_access_token_screenshot.png" alt="Install and and get token screenshot" width="502" />

5.7. Find your __Miro Organization ID__ as you will need it when running the scripts. You will find your __Miro Organization ID__ in the URL of the page where you received the REST API token

<img src="https://miro-org.s3.eu-central-1.amazonaws.com/board_classification/get_miro_org_id_screenshot.png" alt="Install and and get token screenshot" width="903" />

## Step 6. Run script `getMiroBoards.js` using the command line (CLI)

6.1. Run `node getMiroBoards.js`.

6.2. Enter the information asked by the script when prompted:
    
  * `Enter your Miro Organization ID`: enter your Miro Organization ID (see step 5.7) and hit "Enter"
    
  * `Enter your Miro REST API Token`: Enter your Miro REST API Token (see step 5.6) and hit "Enter"

6.3. After the script `getMiroBoards.js` has run, review the summary presented in the command line and review the reports created within the folder `miro_getboards_output_files` in the directory where the script files live.

## Step 7. Revoke REST API token

The steps in this section are optional.

If you are running this script as a one-off action you can revoke the REST API token if you don't plan to use these functionalities in the future. 

7.1. To revoke the REST API token, go to __[Profile settings](https://help.miro.com/hc/en-us/articles/4408879513874-Profile-settings) > Your apps__ (in your Miro account)

7.2. Locate the app created on step 5.2 and click on it

7.3. Scroll to the bottom of the page and click on the button outlined in red that reads __Delete app__

<img src="https://miro-org.s3.eu-central-1.amazonaws.com/board_classification/delete_app_screenshot.png" alt="Delete app screenshot" width="903" />

## Support

If you have any questions or need assistance setting up this application, please reach out to your Miro Customer Success Manager, Onboarding Consultant, Technical Architect or dedicated Miro Solutions Engineer.
