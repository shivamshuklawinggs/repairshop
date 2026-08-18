import * as yup from 'yup';

const sendDocumentByEmailSchema = yup.object().shape({
    documentPaths: yup.array().of(
        yup.object().shape({
            filename: yup.string().required('Filename is required'),
            path: yup.string().required('File path is required')
        })
    ).min(1, 'At least one document is required').required('Document paths are required'),
    recipientEmail: yup.string().email('Invalid email address').required('Recipient email is required'),
    subject: yup.string().required('Subject is required'),
    message: yup.string().optional()
});

export default sendDocumentByEmailSchema;
