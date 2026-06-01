<?php
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

// 1. Config file ko include karein jahan aapne Mailtrap ke credentials dale hain
require_once 'config.php';

// 2. PHPMailer ki files ko load karna
if (file_exists('vendor/autoload.php')) {
    require 'vendor/autoload.php';
} else {
    // Agar manually folder banaya hai to ye paths chalenge:
    require 'PHPMailer/src/Exception.php';
    require 'PHPMailer/src/PHPMailer.php';
    require 'PHPMailer/src/SMTP.php';
}

// 3. Form se data safely collect karna
$subject = 'New Contact Message'; 
$to = TO_EMAIL; // Ye direct config.php se utha raha hai

$name   = isset($_POST['Name']) ? trim($_POST['Name']) : '';
$email  = isset($_POST['Email']) ? trim($_POST['Email']) : '';
$phone  = isset($_POST['phone']) ? trim($_POST['phone']) : '';
$msg    = isset($_POST['message']) ? trim($_POST['message']) : '';
$subjectInput = isset($_POST['subject']) ? trim($_POST['subject']) : '';
$inquiry = isset($_POST['inquiry']) ? trim($_POST['inquiry']) : '';

// Validation ke koi required field khali na ho
if ($name == '' || $email == '' || $msg == '') {
    echo 'failed';
    exit;
}

// 4. PHPMailer ke zariye SMTP Setup karna
$mail = new PHPMailer(true);

try {
    // Server settings (Ye sab config.php se load ho raha hai)
    $mail->isSMTP();                                            
    $mail->Host       = SMTP_HOST;             
    $mail->SMTPAuth   = true;                                   
    $mail->Username   = SMTP_USER; 
    $mail->Password   = SMTP_PASS; 
    $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;         
    $mail->Port       = SMTP_PORT;                                    

    // Recipients (Email bhejne wala aur receive karne wala)
    $mail->setFrom($to, 'PMA Website');
    $mail->addAddress($to);
    $mail->addReplyTo($email, $name);

    // Content (HTML Email Body)
    $mail->isHTML(true);
    $mail->Subject = $subject;
    
    $mail->Body = "
    <html>
    <head><title>New Contact Message</title></head>
    <body>
    <h2>New Contact Message Received</h2>
    <p><strong>Name:</strong> {$name}</p>
    <p><strong>Email:</strong> {$email}</p>
    <p><strong>Phone:</strong> {$phone}</p>
    <p><strong>Inquiry Type:</strong> {$inquiry}</p>
    <p><strong>Subject:</strong> {$subjectInput}</p>
    <p><strong>Message:</strong><br>{$msg}</p>
    </body>
    </html>
    ";

    // Email Send karna
    $mail->send();
    echo 'sent'; // Agar chali jaye to frontend ko 'sent' response milega
} catch (Exception $e) {
    echo 'failed'; // Agar error aaye to 'failed' response milega
}
?>