const {
    WaterfallDialog,
    ComponentDialog,
    DialogSet,
    DialogTurnStatus
} = require('botbuilder-dialogs');

const {
    ConfirmPrompt,
    TextPrompt,
    ChoicePrompt,
    DateTimePrompt,
    NumberPrompt
} = require('botbuilder-dialogs');

const CHOICE_PROMPT = 'CHOICE_PROMPT';
const CONFIRM_PROMPT = 'CONFIRM_PROMPT';
const TEXT_PROMPT = 'TEXT_PROMPT';
const NUMBER_PROMPT = 'NUMBER_PROMPT';
const DATETIME_PROMPT = 'DATETIME_PROMPT';
const WATERFALL_DIALOG = 'WATERFALL_DIALOG';
var endDialog = '';

class makeReservationDialog extends ComponentDialog {

    constructor(conversationState, userState) {
        super('makeReservationDialog');

        this.addDialog(new TextPrompt(TEXT_PROMPT));
        this.addDialog(new ChoicePrompt(CHOICE_PROMPT));
        this.addDialog(new ConfirmPrompt(CONFIRM_PROMPT));
        this.addDialog(new NumberPrompt(NUMBER_PROMPT, this.noOfParticipantsValidator));
        this.addDialog(new DateTimePrompt(DATETIME_PROMPT));

        this.addDialog(new WaterfallDialog(WATERFALL_DIALOG, [
            // Ask confirmation if user wants to make reservation
            this.firstStep.bind(this),
            // Get name from user
            this.getName.bind(this),
            // Number of participants for reservation
            this.getNumberofParticipants.bind(this),
            // Date of reservation
            this.getDate.bind(this),
            // Time of reservation
            //this.getTime.bind(this),
            this.getDateOut.bind(this),

            // Show summary of values entered by user and ask confirmation to make reservation
            this.confirmStep.bind(this),
            this.summaryStep.bind(this)
        ]));



        this.initialDialogId = WATERFALL_DIALOG;
    }

    async run(turnContext, accessor) {
        const dialogSet = new DialogSet(accessor);
        dialogSet.add(this);
        const dialogContext = await dialogSet.createContext(turnContext);

        const results = await dialogContext.continueDialog();
        if (results.status === DialogTurnStatus.empty) {
            await dialogContext.beginDialog(this.id);
        }

    }

    async firstStep(step) {
        endDialog = false;
        // Running a prompt here means that the next WaterfallStep will be run when the users response is received.
        return await step.prompt(CONFIRM_PROMPT, 'Would you like to book a room?', ['yes', 'no']);
    }

    async getName(step) {

        if (step.result === true) {
            return await step.prompt(TEXT_PROMPT, 'In what name should we book the room?');
        }

        if(step.result === false){
            await step.context.sendActivity("Ok, no problem. You can book the room later.");
            endDialog = true;
            return await step.endDialog();
        }
    }

    async getNumberofParticipants(step) {
        step.values.name = step.result;
        return await step.prompt(NUMBER_PROMPT, 'How many guests (1 - 7)?');
    }

    async getDate(step) {
        step.values.noOfParticipants = step.result;
        return await step.prompt(DATETIME_PROMPT, 'Please provide your check-in date');
    }

    /* async getTime(step) {
        step.values.date = step.result;
        return await step.prompt(DATETIME_PROMPT, 'At what time?');
    }

    async confirmStep(step) {
        step.values.time = step.result;
        var msg = ` You have entered following values: \n Name: ${step.values.name} \n Participants: ${step.values.noOfParticipants} \n Date: ${JSON.stringify(step.values.date)} \n Time: ${JSON.stringify(step.values.time)}`
        await step.context.sendActivity(msg);
        return await step.prompt(CONFIRM_PROMPT, 'Are you sure all values are correct and you want to make reservation?', ['Yes', 'NO']);

    } */

    async getDateOut(step) {
        step.values.date = step.result;
        return await step.prompt(DATETIME_PROMPT, 'Please provide your check-out date');
    }

    async confirmStep(step) {
        step.values.date = step.result;
        var msg = ` You have entered following values: \n Name: ${step.values.name} \n Participants: ${step.values.noOfParticipants} \n Check-in Date: ${JSON.stringify(step.values.date)} \n Check-out Date: ${JSON.stringify(step.values.date)}`
        await step.context.sendActivity(msg);
        return await step.prompt(CONFIRM_PROMPT, 'Are you sure all values are correct and you want to continue with the booking?', ['Yes', 'NO']);

    } 

    async summaryStep(step) {
        if (step.result == true) {
            // Business logic

            await step.context.sendActivity("Congratulations! Your booking has been made");
            endDialog = true;
            return await step.endDialog();
        }

        if (step.result == false) {
            // Business logic

            await step.context.sendActivity("Oops! Looks like you don't want to go ahead with the booking");
            endDialog = true;
            return await step.endDialog();
        }
    }

    async noOfParticipantsValidator(promptContext) {
        return promptContext.recognized.succeeded && promptContext.recognized.value >= 1 && promptContext.recognized.value <= 7;
    }

    async isDialogComplete() {
        return endDialog;
    }
}

//module.exports = { makeReservationDialog }; 
module.exports.makeReservationDialog = makeReservationDialog;