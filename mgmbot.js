// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

const { ActivityHandler, MessageFactory } = require('botbuilder');
const { makeReservationDialog } = require('./componentDialogs/MakeReservationDialog');
const { cancelReservationDialog, CancelReservationDialog } = require('./componentDialogs/cancelReservationDialog');
//const { MakeReservationDialog } = require('./componentDialogs/MakeReservationDialog');

class MGMBOT extends ActivityHandler {
    constructor(conversationState, userState) {
        super();

        this.conversationState = conversationState;
        this.userState = userState;
        this.dialogState = conversationState.createProperty("dialogState");
        this.makeReservationDialog = new makeReservationDialog(this.conversationState,this.userState);
        this.cancelReservationDialog = new CancelReservationDialog(this.conversationState,this.userState);
        //this.makeReservationDialog = new MakeReservationDialog(this.conversationState,this.userState);

        this.previousIntent = this.conversationState.createProperty("previousIntent");
        this.conversationData = this.conversationState.createProperty("conversationData");


        // See https://aka.ms/about-bot-activity-message to learn more about the message and other activity types.
        this.onMessage(async (context, next) => {
            /*const replyText = `Echo: ${ context.activity.text }`;
            await context.sendActivity(MessageFactory.text(replyText, replyText)); */

            await this.dispatchToIntentAsync(context);
            // By calling next() you ensure that the next BotHandler is run.
            await next();
        });

        this.onDialog(async(context,next) => {
            await this.conversationState.saveChanges(context,false);
            await this.userState.saveChanges(context,false);
            await next();
        });

        this.onMembersAdded(async (context, next) => {
            await this.sendWelcomeMessage(context);
            // By calling next() you ensure that the next BotHandler is run.
            await next();
        });
    }

    async sendWelcomeMessage(turnContext) {
        const { activity } = turnContext;

        //Iterate over all new members added to the conversation.
        for(const idx in activity.membersAdded) {
            if(activity.membersAdded[idx].id !== activity.recipient.id) {
                const welcomeMessage = `Welcome to MGM ChatBot ${ activity.membersAdded[idx].name }. `;
                await turnContext.sendActivity(welcomeMessage);
                await this.sendSuggestedActions(turnContext);
            }
        }
    }

    async sendSuggestedActions(turnContext) {
        var reply = MessageFactory.suggestedActions(['Book a Room','Cancel Room Booking','List of Hotels'],'What would you like to do?');
        await turnContext.sendActivity(reply);
    }

    async dispatchToIntentAsync(context) {

        var currentIntent = '';
        const previousIntent = await this.previousIntent.get(context, {});
        const conversationData = await this.conversationData.get(context, {});

        if(previousIntent.intentName && conversationData.endDialog === false) {
            
            currentIntent = previousIntent.intentName;
        }
        else if(previousIntent.intentName && conversationData.endDialog === true) {

            currentIntent = context.activity.text;
        }
        else {
            currentIntent = context.activity.text;
            await this.previousIntent.set(context,{intentName: context.activity.text});

        }


        switch(currentIntent) {

            case 'Book a Room':
                console.log("Inside Book a Room case");
                await this.conversationData.set(context,{endDialog: false});
                await this.makeReservationDialog.run(context,this.dialogState);
                conversationData.endDialog = await this.makeReservationDialog.isDialogComplete();
                if(conversationData.endDialog) {
                    await this.previousIntent.set(context, { intentName: null});
                    await this.sendSuggestedActions(context);
                }
                break;

                case 'Cancel Room Booking':
                console.log("Inside Cancel Room Booking case");
                await this.conversationData.set(context,{endDialog: false});
                await this.cancelReservationDialog.run(context,this.dialogState);
                conversationData.endDialog = await this.cancelReservationDialog.isDialogComplete();
                if(conversationData.endDialog) {
                    await this.previousIntent.set(context, { intentName: null});
                    await this.sendSuggestedActions(context);
                }
                break;
            

            default:
                console.log("Did not match Book a Room case");
                break;


        }
    }
}

module.exports.MGMBOT = MGMBOT;
