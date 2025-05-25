import dotenv from 'dotenv';

dotenv.config();

/**
 * Simple console-based email service for testing
 * This doesn't attempt to send real emails, just logs them to the console
 */

// Format the email content for console display
const formatEmailForConsole = (options) => {
  const { to, subject, text } = options;
  const border = '='.repeat(80);
  const timestamp = new Date().toISOString();
  
  return `
${border}
📧 EMAIL SENT AT ${timestamp} 📧
${border}

TO: ${to}
SUBJECT: ${subject}

${text}

${border}
`;
};

// Simple mock transporter that just logs emails to console
const transporter = {
  sendMail: (mailOptions) => {
    const formattedEmail = formatEmailForConsole(mailOptions);
    console.log(formattedEmail);
    return Promise.resolve({ 
      messageId: 'test-email-' + Date.now(),
      response: 'Email logged to console'
    });
  }
};

/**
 * Send an email
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.text - Plain text body
 * @param {string} options.html - HTML body (optional)
 * @returns {Promise<Object>} - Email send info
 */
const sendEmail = async (options) => {
  try {
    const { to, subject, text, html } = options;
    
    const mailOptions = {
      from: '"College Admission System" <college-admin@example.com>',
      to,
      subject,
      text,
      html: html || text
    };
    
    // Send the email (in our case, just log it to console)
    const info = await transporter.sendMail(mailOptions);
    
    return {
      success: true,
      messageId: info.messageId
    };
  } catch (error) {
    console.error('Error sending email:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Send application confirmation email
 * @param {Object} application - Application data
 * @returns {Promise<Object>} - Email send info
 */
export const sendApplicationConfirmation = async (application) => {
  const { email, firstName, lastName, course } = application;
  
  if (!email) {
    console.warn('Cannot send confirmation email: No email address provided');
    return { success: false, error: 'No email address provided' };
  }
  
  const subject = 'Application Received - College Admission';
  const text = `
Dear ${firstName || ''} ${lastName || ''},

Thank you for submitting your application to our college for the ${course} program.

Your application has been received and is currently being processed. You will be notified via email once a decision has been made regarding your application.

Please note that the admission process may take some time as we carefully review all applications.

If you have any questions, please feel free to contact our admissions office.

Best regards,
College Admissions Team
`;

  return await sendEmail({ to: email, subject, text });
};

/**
 * Send application acceptance email
 * @param {Object} application - Application data
 * @param {string} username - Generated username for login
 * @returns {Promise<Object>} - Email send info
 */
export const sendAcceptanceEmail = async (application, username) => {
  const { email, firstName, lastName, course } = application;
  
  if (!email) {
    console.warn('Cannot send acceptance email: No email address provided');
    return { success: false, error: 'No email address provided' };
  }
  
  const subject = 'Congratulations! Your Application Has Been Accepted';
  const text = `
Dear ${firstName || ''} ${lastName || ''},

Congratulations! We are pleased to inform you that your application to our ${course} program has been accepted.

To access your student dashboard, please use the following username to log in:

Username: ${username}

When you first log in, you will be prompted to set your password.

We look forward to welcoming you to our college. If you have any questions, please contact our admissions office.

Best regards,
College Admissions Team
`;

  return await sendEmail({ to: email, subject, text });
};

/**
 * Send application rejection email
 * @param {Object} application - Application data
 * @returns {Promise<Object>} - Email send info
 */
export const sendRejectionEmail = async (application) => {
  const { email, firstName, lastName, course } = application;
  
  if (!email) {
    console.warn('Cannot send rejection email: No email address provided');
    return { success: false, error: 'No email address provided' };
  }
  
  const subject = 'Update on Your College Application';
  const text = `
Dear ${firstName || ''} ${lastName || ''},

Thank you for your interest in our ${course} program and for taking the time to submit your application.

After careful consideration of all applications, we regret to inform you that we are unable to offer you admission at this time.

Please understand that this decision does not reflect on your abilities or potential. We receive many qualified applicants each year, and unfortunately, we cannot accommodate all of them.

We encourage you to consider applying again in the future or exploring other programs that may align with your interests and qualifications.

If you have any questions about your application or would like feedback, please feel free to contact our admissions office.

Best regards,
College Admissions Team
`;

  return await sendEmail({ to: email, subject, text });
};

/**
 * Send teacher application confirmation email
 * @param {Object} application - Teacher application data
 * @returns {Promise<Object>} - Email send info
 */
export const sendTeacherApplicationConfirmation = async (application) => {
  const { email, firstName, lastName } = application;
  
  if (!email) {
    console.warn('Cannot send confirmation email: No email address provided');
    return { success: false, error: 'No email address provided' };
  }
  
  const subject = 'Application Received - Teaching Position';
  const text = `
Dear ${firstName || ''} ${lastName || ''},

Thank you for submitting your application for a teaching position at our college.

Your application has been received and is currently being reviewed by our hiring committee. We appreciate your interest in joining our faculty.

You will be notified via email once a decision has been made regarding your application.

If you have any questions or need to provide additional information, please feel free to contact our HR department.

Best regards,
College HR Department
`;

  return await sendEmail({ to: email, subject, text });
};

/**
 * Send teacher application acceptance email
 * @param {Object} application - Teacher application data
 * @param {string} username - Generated username for login
 * @returns {Promise<Object>} - Email send info
 */
export const sendTeacherAcceptanceEmail = async (application, username) => {
  const { email, firstName, lastName } = application;
  
  if (!email) {
    console.warn('Cannot send acceptance email: No email address provided');
    return { success: false, error: 'No email address provided' };
  }
  
  const subject = 'Congratulations! Your Teaching Application Has Been Accepted';
  const text = `
Dear ${firstName || ''} ${lastName || ''},

We are pleased to inform you that your application for a teaching position at our college has been accepted.

To access the faculty portal, please use the following username to log in:

Username: ${username}

When you first log in, you will be prompted to set your password.

Our HR department will be in touch shortly with further details about your onboarding process and start date.

We look forward to welcoming you to our faculty. If you have any questions, please contact our HR department.

Best regards,
College HR Department
`;

  return await sendEmail({ to: email, subject, text });
};

/**
 * Send teacher application rejection email
 * @param {Object} application - Teacher application data
 * @returns {Promise<Object>} - Email send info
 */
export const sendTeacherRejectionEmail = async (application) => {
  const { email, firstName, lastName } = application;
  
  if (!email) {
    console.warn('Cannot send rejection email: No email address provided');
    return { success: false, error: 'No email address provided' };
  }
  
  const subject = 'Update on Your Teaching Application';
  const text = `
Dear ${firstName || ''} ${lastName || ''},

Thank you for your interest in joining our college as a faculty member and for taking the time to submit your application.

After careful consideration of all applications, we regret to inform you that we are unable to offer you a teaching position at this time.

Please understand that this decision does not reflect on your qualifications or abilities. We receive many qualified applicants for each position, and unfortunately, we cannot accommodate all of them.

We encourage you to apply for future openings that match your qualifications and experience.

We appreciate your interest in our institution and wish you success in your career.

Best regards,
College HR Department
`;

  return await sendEmail({ to: email, subject, text });
};

export default {
  sendEmail,
  sendApplicationConfirmation,
  sendAcceptanceEmail,
  sendRejectionEmail,
  sendTeacherApplicationConfirmation,
  sendTeacherAcceptanceEmail,
  sendTeacherRejectionEmail
};
