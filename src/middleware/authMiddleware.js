import jwt from "jsonwebtoken";

export const authenticate = async (req , res , next) => {
    try{
        const authHeader = req.headers.authorization;

        if(!authHeader || !authHeader.startsWith("Bearer")){
            return res.status(400).json({error : "Access denied. No token provided."});
        }

        const token = authHeader.split(' ')[1];


        // Verify the token using your secret key from .env
        // If it's tampered with or expired, this will throw an error to the catch block
        const decodedPayload = jwt.verify(token , process.env.JWT_SECRET);


        //Attach the decoded user data to the Express 'req' object
        // Now every controller after this has access to req.user!
        req.user = decodedPayload;

        //Let them through to the controller!
        next();


    }
    catch (next){
       return res.status(401).json({ error: "Invalid or expired token." });
    }
};