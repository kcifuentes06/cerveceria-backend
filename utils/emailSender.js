// En /utils/emailSender.js
const nodemailer = require('nodemailer'); 

// Configuración del transportador de correo (ADAPTAR ESTO)
// Necesitarás configurar un servicio de correo real (Gmail, SendGrid, etc.)
const transporter = nodemailer.createTransport({
    // EJEMPLO de GMAIL (debe usar Contraseña de Aplicación)
    service: 'gmail',
    auth: {
        user: 'kevin.cifuentes25@gmail.com', 
        pass: 'C1fu3nt3$1995.'    
    }
});

async function sendDigitalReceipt(recipientEmail, orderDetails) {
    if (!recipientEmail) return console.error('No se puede enviar el correo: Receptor no definido.');

    try {
        const mailOptions = {
            from: '"Cervecería Artesanal" <ventas@tu-cerveceria.com>',
            to: recipientEmail,
            subject: `Boleta Digital: Pedido #${orderDetails._id.toString().slice(-6)}`,
            html: `
                <h2>¡Gracias por tu compra!</h2>
                <p>Tu pedido será despachado pronto.</p>
                <p><strong>Número de Pedido:</strong> ${orderDetails._id}</p>
                <p><strong>Total Pagado:</strong> $${orderDetails.total_pedido.toLocaleString('es-CL')}</p>
                <p>--- Esta es tu boleta digital ---</p>
                <p>Puedes ver el detalle completo en tu cuenta.</p>
            `,
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Boleta enviada a:', recipientEmail, 'Message ID:', info.messageId);
        return true;
    } catch (error) {
        console.error('Error al enviar boleta por correo:', error);
        return false;
    }
}

module.exports = { sendDigitalReceipt };