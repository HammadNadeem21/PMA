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


$full_name = isset($_POST['full_name']) && trim($_POST['full_name']) !== '' ? trim($_POST['full_name']) : 'Not Provided';
$email = isset($_POST['email']) && trim($_POST['email']) !== '' ? trim($_POST['email']) : 'Not Provided';
$phone = isset($_POST['phone']) && trim($_POST['phone']) !== '' ? trim($_POST['phone']) : 'Not Provided';
$background = isset($_POST['background']) && trim($_POST['background']) !== '' ? trim($_POST['background']) : 'Not Provided';
$city = isset($_POST['city']) && trim($_POST['city']) !== '' ? trim($_POST['city']) : 'Not Provided';
$program = isset($_POST['program']) && trim($_POST['program']) !== '' ? trim($_POST['program']) : 'Not Provided';
$additional_info = isset($_POST['additional_info']) && trim($_POST['additional_info']) !== '' ? trim($_POST['additional_info']) : 'Not Provided';

$program_labels = [
    'accredited' => 'Mediation Skills Accredited Course',
    'introductory' => 'Mediation Skills Introductory Course',
];
$program_label = isset($program_labels[$program]) ? $program_labels[$program] : $program;



$mail = new PHPMailer(true);

try {
    $mail->isSMTP();
    $mail->Host = SMTP_HOST;
    $mail->SMTPAuth = true;
    $mail->Username = SMTP_USER;
    $mail->Password = SMTP_PASS;


    $mail->SMTPSecure = PHPMailer::ENCRYPTION_SMTPS;
    $mail->Port = SMTP_PORT;

    $mail->setFrom(TO_EMAIL, 'PMA Training Portal');
    $mail->addAddress(TO_EMAIL);


    if ($email !== 'Not Provided') {
        $mail->addReplyTo($email, $full_name);
    }
    $mail->isHTML(true);
    $mail->Subject = 'New Training Enrollment Application — ' . $program_label;

    $mail->Body = "
    <html>
    <head><title>Training Enrollment Application</title></head>
    <body style='font-family: Arial, sans-serif; color: #333; line-height: 1.6;'>
        <div style='max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px;'>
            <h2 style='color: #213449; border-bottom: 2px solid #213449; padding-bottom: 10px;'>New Training Enrollment Application</h2>
            <table cellpadding='8' cellspacing='0' style='border-collapse: collapse; width: 100%;'>
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
        </div>
    </body>
    </html>
    ";

    $mail->send();
    echo json_encode(['status' => 'success', 'message' => 'Enrollment application sent successfully!']);
} catch (Exception $e) {
    echo json_encode(['status' => 'error', 'message' => 'Mailer Error: ' . $mail->ErrorInfo]);
}
exit;
?>