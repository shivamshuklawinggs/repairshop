import * as nodemailer from 'nodemailer';
import * as dotenv from 'dotenv';
import  { isProduction } from 'config';
import EmailDailyCount from 'models/EmailDailyCount.model';
import moment from 'moment';
dotenv.config();


const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT),
    secure: Number(process.env.EMAIL_PORT) === 465, // ← ✅ Fix here

    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    
    },
});

const sendEmail = async ({to,subject,html,attachments=[],cc,bcc,text}:{to: string, subject: string, html?: string, attachments?: Array<{filename: string,content:Buffer}>, cc?: string[], bcc?: string[],text?:string}) => {
    try {
        console.log("email sent  to",to)
        if(!to) return 
        const mailOptions: any = {
            from: process.env.EMAIL_USER,
            to:isProduction?to:"shivamshukla@winggs.com",
            subject,
            html,
            attachments,
            text
        };

        if (cc && cc.length > 0 && isProduction) {
            mailOptions.cc = cc;
        }

        if (bcc && bcc.length > 0 && isProduction) {
            mailOptions.bcc = bcc;
        }

        await transporter.sendMail(mailOptions);

        const today =moment().format('LL')
        const updated = await EmailDailyCount.findOneAndUpdate(
          { date: today },
          { $inc: { count: 1 } },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        ).catch((e)=>console.error("Failled To Save Daily Email Counts",e.message));
        console.info(`Email sent successfully. Daily count for ${today}: ${updated?.count ?? 0}`);
    } catch (error) {
        console.warn('Error sending email:', error);
        throw error;
    }
};
export default sendEmail