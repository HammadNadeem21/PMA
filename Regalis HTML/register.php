<?php
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

// Collect and sanitize form data
$full_name       = isset($_POST['full_name'])       ? trim($_POST['full_name'])       : '';
$email           = isset($_POST['email'])           ? trim($_POST['email'])           : '';
$phone           = isset($_POST['phone'])           ? trim($_POST['phone'])           : '';
$background      = isset($_POST['background'])      ? trim($_POST['background'])      : '';
$city            = isset($_POST['city'])            ? trim($_POST['city'])            : '';
$program         = isset($_POST['program'])         ? trim($_POST['program'])         : '';
$additional_info = isset($_POST['additional_info']) ? trim($_POST['additional_info']) : '';

// Map program value to readable label
$program_labels = [
    'accredited'   => 'Mediation Skills Accredited Course',
    'introductory' => 'Mediation Skills Introductory Course',
];
$program_label = isset($program_labels[$program]) ? $program_labels[$program] : $program;

// Basic validation — required fields must not be empty
if ($full_name === '' || $email === '' || $phone === '' || $background === '' || $city === '' || $program === '') {
    echo 'failed';
    exit;
}

$mail = new PHPMailer(true);

try {
    $mail->isSMTP();
    $mail->Host       = SMTP_HOST;
    $mail->SMTPAuth   = true;
    $mail->Username   = SMTP_USER;
    $mail->Password   = SMTP_PASS;
    $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
    $mail->Port       = SMTP_PORT;

    $mail->setFrom(TO_EMAIL, 'PMA Website');
    $mail->addAddress(TO_EMAIL);
    $mail->addReplyTo($email, $full_name);

    $mail->isHTML(true);
    $mail->Subject = 'New Training Enrollment Application — ' . $program_label;

    $mail->Body = "
    <html>
    <head><title>Training Enrollment Application</title></head>
    <body style='font-family: Arial, sans-serif; color: #333;'>
        <h2 style='color: #213449;'>New Training Enrollment Application</h2>
        <table cellpadding='8' cellspacing='0' style='border-collapse: collapse; width: 100%; max-width: 600px;'>
            <tr style='background:#f4f6f8;'>
                <td style='border:1px solid #ddd; font-weight:bold; width:40%;'>Full Name</td>
                <td style='border:1px solid #ddd;'>{$full_name}</td>
            </tr>
            <tr>
                <td style='border:1px solid #ddd; font-weight:bold;'>Email</td>
                <td style='border:1px solid #ddd;'>{$email}</td>
            </tr>
            <tr style='background:#f4f6f8;'>
                <td style='border:1px solid #ddd; font-weight:bold;'>Phone</td>
                <td style='border:1px solid #ddd;'>{$phone}</td>
            </tr>
            <tr>
                <td style='border:1px solid #ddd; font-weight:bold;'>Professional Background</td>
                <td style='border:1px solid #ddd;'>{$background}</td>
            </tr>
            <tr style='background:#f4f6f8;'>
                <td style='border:1px solid #ddd; font-weight:bold;'>City</td>
                <td style='border:1px solid #ddd;'>{$city}</td>
            </tr>
            <tr>
                <td style='border:1px solid #ddd; font-weight:bold;'>Selected Program</td>
                <td style='border:1px solid #ddd;'>{$program_label}</td>
            </tr>
            <tr style='background:#f4f6f8;'>
                <td style='border:1px solid #ddd; font-weight:bold;'>Additional Information</td>
                <td style='border:1px solid #ddd;'>{$additional_info}</td>
            </tr>
        </table>
    </body>
    </html>
    ";

    $mail->send();
    echo 'sent';
} catch (Exception $e) {
    echo 'failed';
}
?>
