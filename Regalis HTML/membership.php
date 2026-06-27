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
$father_name = isset($_POST['father_name']) && trim($_POST['father_name']) !== '' ? trim($_POST['father_name']) : 'Not Provided';
$qualification = isset($_POST['qualification']) && trim($_POST['qualification']) !== '' ? trim($_POST['qualification']) : 'Not Provided';
$designation = isset($_POST['designation']) && trim($_POST['designation']) !== '' ? trim($_POST['designation']) : 'Not Provided';
$cnic = isset($_POST['cnic']) && trim($_POST['cnic']) !== '' ? trim($_POST['cnic']) : 'Not Provided';
$chamber_phone = isset($_POST['chamber_phone']) && trim($_POST['chamber_phone']) !== '' ? trim($_POST['chamber_phone']) : 'Not Provided';

$office_address = isset($_POST['office_address']) && trim($_POST['office_address']) !== '' ? trim($_POST['office_address']) : 'Not Provided';
$res_address = isset($_POST['res_address']) && trim($_POST['res_address']) !== '' ? trim($_POST['res_address']) : 'Not Provided';
$res_phone = isset($_POST['res_phone']) && trim($_POST['res_phone']) !== '' ? trim($_POST['res_phone']) : 'Not Provided';
$email = isset($_POST['email']) && trim($_POST['email']) !== '' ? trim($_POST['email']) : 'Not Provided';

$proposer_name = isset($_POST['proposer_name']) && trim($_POST['proposer_name']) !== '' ? trim($_POST['proposer_name']) : 'N/A';
$proposer_address = isset($_POST['proposer_address']) && trim($_POST['proposer_address']) !== '' ? trim($_POST['proposer_address']) : 'N/A';
$proposer_phone = isset($_POST['proposer_phone']) && trim($_POST['proposer_phone']) !== '' ? trim($_POST['proposer_phone']) : 'N/A';

$seconder_name = isset($_POST['seconder_name']) && trim($_POST['seconder_name']) !== '' ? trim($_POST['seconder_name']) : 'N/A';
$seconder_address = isset($_POST['seconder_address']) && trim($_POST['seconder_address']) !== '' ? trim($_POST['seconder_address']) : 'N/A';
$seconder_phone = isset($_POST['seconder_phone']) && trim($_POST['seconder_phone']) !== '' ? trim($_POST['seconder_phone']) : 'N/A';

$subject = 'New Membership Application: ' . $full_name;
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

    $mail->setFrom($to, 'PMA Membership Portal');
    $mail->addAddress($to);

    if ($email !== 'Not Provided') {
        $mail->addReplyTo($email, $full_name);
    }


    $attachmentCount = 0;
    $attachmentProblems = [];

    if (isset($_FILES['documents'])) {
        if (!empty($_FILES['documents']['name'][0])) {
            foreach ($_FILES['documents']['tmp_name'] as $key => $tmp_name) {
                $file_name = $_FILES['documents']['name'][$key];
                $file_size = $_FILES['documents']['size'][$key];
                $file_error = $_FILES['documents']['error'][$key];

                if ($file_error === UPLOAD_ERR_OK && $file_size <= 5242880) {
                    $mail->addAttachment($tmp_name, $file_name);
                    $attachmentCount++;
                } else {
                    $reason = 'unknown error';
                    if ($file_error !== UPLOAD_ERR_OK) {
                        switch ($file_error) {
                            case UPLOAD_ERR_INI_SIZE:
                            case UPLOAD_ERR_FORM_SIZE:
                                $reason = 'file too large';
                                break;
                            case UPLOAD_ERR_PARTIAL:
                                $reason = 'partial upload';
                                break;
                            case UPLOAD_ERR_NO_FILE:
                                $reason = 'no file uploaded';
                                break;
                            default:
                                $reason = 'upload error code ' . $file_error;
                                break;
                        }
                    } elseif ($file_size > 5242880) {
                        $reason = 'file larger than 5MB';
                    }
                    $attachmentProblems[] = $file_name . ' (' . $reason . ')';
                }
            }
        }
    }


    $mail->isHTML(true);
    $mail->Subject = $subject;

    $mail->Body = "
    <html>
    <head><title>Membership Details</title></head>
    <body style='font-family: Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f4f6f9; padding: 20px;'>
        <div style='max-width: 700px; margin: 0 auto; background: #ffffff; padding: 30px; border-radius: 8px; border: 1px solid #dcdcdc; box-shadow: 0 4px 8px rgba(0,0,0,0.05);'>
            <h2 style='color: #1e3a8a; border-bottom: 2px solid #1e3a8a; padding-bottom: 10px; margin-top: 0;'>PMA Membership Application</h2>
            
            <h3 style='color: #b45309; margin-top: 20px;'>1. Personal Details</h3>
            <table style='width: 100%; border-collapse: collapse; margin-bottom: 15px;'>
                <tr><td style='padding: 6px 0; font-weight: bold; width: 35%;'>Full Name:</td><td>{$full_name}</td></tr>
                <tr><td style='padding: 6px 0; font-weight: bold;'>Father Name:</td><td>{$father_name}</td></tr>
                <tr><td style='padding: 6px 0; font-weight: bold;'>Qualification:</td><td>{$qualification}</td></tr>
                <tr><td style='padding: 6px 0; font-weight: bold;'>Designation:</td><td>{$designation}</td></tr>
                <tr><td style='padding: 6px 0; font-weight: bold;'>CNIC:</td><td>{$cnic}</td></tr>
                <tr><td style='padding: 6px 0; font-weight: bold;'>Chamber Phone:</td><td>{$chamber_phone}</td></tr>
            </table>

            <h3 style='color: #b45309; margin-top: 20px;'>2. Contact Details</h3>
            <table style='width: 100%; border-collapse: collapse; margin-bottom: 15px;'>
                <tr><td style='padding: 6px 0; font-weight: bold; width: 35%;'>Office Address:</td><td>{$office_address}</td></tr>
                <tr><td style='padding: 6px 0; font-weight: bold;'>Residential Address:</td><td>{$res_address}</td></tr>
                <tr><td style='padding: 6px 0; font-weight: bold;'>Residence Phone:</td><td>{$res_phone}</td></tr>
                <tr><td style='padding: 6px 0; font-weight: bold;'>Email Address:</td><td>{$email}</td></tr>
            </table>

            <h3 style='color: #b45309; margin-top: 20px;'>3. Professional References</h3>
            <table style='width: 100%; border-collapse: collapse;'>
                <tr style='background: #f3f4f6;'><td colspan='2' style='padding: 5px; font-weight: bold; color: #1e3a8a;'>Proposer Information</td></tr>
                <tr><td style='padding: 6px 0; font-weight: bold; width: 35%;'>Name:</td><td>{$proposer_name}</td></tr>
                <tr><td style='padding: 6px 0; font-weight: bold;'>Address:</td><td>{$proposer_address}</td></tr>
                <tr><td style='padding: 6px 0; font-weight: bold;'>Phone:</td><td>{$proposer_phone}</td></tr>
                
                <tr style='background: #f3f4f6;'><td colspan='2' style='padding: 5px; font-weight: bold; color: #1e3a8a; margin-top: 10px;'>Seconder Information</td></tr>
                <tr><td style='padding: 6px 0; font-weight: bold;'>Name:</td><td>{$seconder_name}</td></tr>
                <tr><td style='padding: 6px 0; font-weight: bold;'>Address:</td><td>{$seconder_address}</td></tr>
                <tr><td style='padding: 6px 0; font-weight: bold;'>Phone:</td><td>{$seconder_phone}</td></tr>
            </table>
            
            <p style='margin-top: 25px; font-size: 12px; color: #666; font-style: italic; background: #fdf2e9; padding: 10px; border-left: 3px solid #b45309;'>
                * Application processed via background setup. Attachments handled: {$attachmentCount}.
            </p>
        </div>
    </body>
    </html>
    ";

    $mail->send();


    $msg = 'Your membership application has been submitted successfully!';
    if (!empty($attachmentProblems)) {
        $msg .= ' (Some files skipped: ' . implode(', ', $attachmentProblems) . ')';
    }

    echo json_encode(['status' => 'success', 'message' => $msg]);

} catch (Exception $e) {
    echo json_encode(['status' => 'error', 'message' => 'Mailer Error: ' . $mail->ErrorInfo]);
}
exit;
?>