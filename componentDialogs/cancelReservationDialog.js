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

class CancelReservationDialog extends ComponentDialog {

    constructor(conversationState, userState) {
        super('cancelReservationDialog');

        this.addDialog(new TextPrompt(TEXT_PROMPT));
        this.addDialog(new ChoicePrompt(CHOICE_PROMPT));
        this.addDialog(new ConfirmPrompt(CONFIRM_PROMPT));
        this.addDialog(new NumberPrompt(NUMBER_PROMPT));
        this.addDialog(new DateTimePrompt(DATETIME_PROMPT));

        this.addDialog(new WaterfallDialog(WATERFALL_DIALOG, [
            // Ask confirmation if user wants to make reservation
            this.firstStep.bind(this),
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
        //return await step.prompt(TEXT_PROMPT, 'Enter the M-Life number for cancellation: ');
        //var cancelText = `Enter the M-Life number for cancellation: `
        await step.context.sendActivity("Enter the M-Life number for cancellation: ");
        return await step.prompt(TEXT_PROMPT,'');
    }


    async confirmStep(step) {
        step.values.bookingNo = step.result;
        var msg = ` Please check the \n M-Life Number you have provided: ${step.values.bookingNo} `
        await step.context.sendActivity(msg);
        return await step.prompt(CONFIRM_PROMPT, 'Are you sure you want to cancel your booking?', ['Yes', 'No']);

    } 

    async summaryStep(step) {
        if (step.result == true) {
            // Business logic

            await step.context.sendActivity("Booking successfully cancelled.");
            endDialog = true;
            return await step.endDialog();
        }

        if (step.result == false) {
            // Business logic

            await step.context.sendActivity("You chose not to go ahead with the cancellation.");
            endDialog = true;
            return await step.endDialog();
        }
    }

    async isDialogComplete() {
        return endDialog;
    }
}

//module.exports = { makeReservationDialog }; 
module.exports.CancelReservationDialog = CancelReservationDialog;