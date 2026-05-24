<?php
$subject = 'New Contact Message'; // Subject of your email
$to = 'contact@designesia.com';  // Recipient's email

// Collect form data safely
$name   = isset($_POST['Name']) ? trim($_POST['Name']) : '';
$email  = isset($_POST['Email']) ? trim($_POST['Email']) : '';
$phone  = isset($_POST['phone']) ? trim($_POST['phone']) : '';
$msg    = isset($_POST['message']) ? trim($_POST['message']) : '';

// Validate required fields
if ($name == '' || $email == '' || $phone == '' || $msg == '') {
    echo 'failed';
    exit;
}

// Email headers
$headers  = "MIME-Version: 1.0" . "\r\n";
$headers .= "Content-type:text/html;charset=UTF-8" . "\r\n";
$headers .= "From: {$name} <{$email}>" . "\r\n";
$headers .= "Reply-To: {$email}" . "\r\n";

// Email message (HTML formatted)
$message = "
<html>
<head>
<title>New Contact Message</title>
</head>
<body>
<h2>New Contact Message Received</h2>
<p><strong>Name:</strong> {$name}</p>
<p><strong>Email:</strong> {$email}</p>
<p><strong>Phone:</strong> {$phone}</p>
<p><strong>Message:</strong><br>{$msg}</p>
</body>
</html>
";

// Send email
if (mail($to, $subject, $message, $headers)) {
    echo 'sent'; // Success response
} else {
    echo 'failed'; // Error response
}
?>
