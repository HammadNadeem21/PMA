<?php
error_reporting(0);
ini_set('display_errors', 0);

header('Content-Type: application/json');

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;


require_once 'config.php';


if (file_exists('vendor/autoload.php')) {
    require 'vendor/autoload.php';
} else {
    require 'PHPMailer/src/Exception.php';
    require 'PHPMailer/src/PHPMailer.php';
    require 'PHPMailer/src/SMTP.php';
}


$name = isset($_POST['Name']) && trim($_POST['Name']) !== '' ? trim($_POST['Name']) : 'Not Provided';
$email = isset($_POST['Email']) && trim($_POST['Email']) !== '' ? trim($_POST['Email']) : 'Not Provided';
$phone = isset($_POST['phone']) && trim($_POST['phone']) !== '' ? trim($_POST['phone']) : 'Not Provided';
$msg = isset($_POST['message']) && trim($_POST['message']) !== '' ? trim($_POST['message']) : 'Not Provided';
$subjectInput = isset($_POST['subject']) && trim($_POST['subject']) !== '' ? trim($_POST['subject']) : 'General Query';
$inquiry = isset($_POST['inquiry']) && trim($_POST['inquiry']) !== '' ? trim($_POST['inquiry']) : 'Not Provided';

$subject = 'New Contact Message';
$to = TO_EMAIL;


$mail = new PHPMailer(true);

try {

    $mail->isSMTP();
    $mail->Host = SMTP_HOST;
    $mail->SMTPAuth = true;
    $mail->Username = SMTP_USER;
    $mail->Password = SMTP_PASS;


    $mail->SMTPSecure = PHPMailer::ENCRYPTION_SMTPS;
    $mail->Port = SMTP_PORT;


    $mail->setFrom($to, 'PMA Website - Contact');
    $mail->addAddress($to);


    if ($email !== 'Not Provided') {
        $mail->addReplyTo($email, $name);
    }


    $mail->isHTML(true);
    $mail->Subject = $subject . ': ' . $subjectInput;

    $mail->Body = "
    <html>
    <head>
        <title>New Contact Message</title>
    </head>
    <body style='font-family: Arial, sans-serif; color: #333; line-height: 1.6;'>
        <div style='max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px;'>
            <h2 style='color: #1e3a8a; border-bottom: 2px solid #1e3a8a; padding-bottom: 10px;'>New Contact Query Received</h2>
            <p><strong>Name:</strong> {$name}</p>
            <p><strong>Email:</strong> {$email}</p>
            <p><strong>Phone:</strong> {$phone}</p>
            <p><strong>Inquiry Type:</strong> {$inquiry}</p>
            <p><strong>Subject:</strong> {$subjectInput}</p>
            <p style='background: #f9f9f9; padding: 15px; border-left: 4px solid #1e3a8a;'><strong>Message:</strong><br>" . nl2br($msg) . "</p>
        </div>
    </body>
    </html>
    ";

    $mail->send();
    echo json_encode(['status' => 'success', 'message' => 'Your message has been sent successfully!']);
} catch (Exception $e) {
    echo json_encode(['status' => 'error', 'message' => 'Mailer Error: ' . $mail->ErrorInfo]);
}
exit;
?>