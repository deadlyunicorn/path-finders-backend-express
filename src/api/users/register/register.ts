import { Request, Response } from "express";
import { client } from "../../../db/connection";
import { getHashAndPassword } from "./passGenerator";
import { ErrorMessages } from "../../../../types";


//POST userId. 
//userID already exists in DB? 
//return them the error ( Already exists, please try another one - this will appear inside the flutter app ).


export const registerUser = async( req: Request, res: Response ) => {
  
  const body = req.body;
  const userId: string | null = body["userId"];
  const accounts = client.db('path_finders').collection('accounts');



  try{
    if ( userId ){

      const userIdValue = Number.parseInt( userId );  
      if ( 
        Number.isNaN( userIdValue ) 
        || userIdValue < 100_000 
        || userIdValue > 999_999 
      ){
        throw "Invalid Id Value.";
      }

      const userExists = await accounts.findOne({ userId: userIdValue });
      if ( userExists ){
        throw "Id Not Available.";
      }
      else{

        const hashAndPass = await getHashAndPassword();
        if ( hashAndPass["error"] ){
          throw hashAndPass["error"].message;
        }
        const { hash, pass } = hashAndPass["data"];
        
        if ( userIdValue !== 100_000 ){
          await accounts.insertOne({
            userId: userIdValue,
            pass: pass
          })
        }
        else if ( process.env.dev !== "true" ){
          throw "Id Not Available.";
        }
        

        res.json({
          data: {
            hash: hash
          }
        })


      }

      
    }
    else{
      throw ErrorMessages.InvalidRequest;
    }
  }
  catch( error ){
    res.json({
      error:{
        message: error
      }
    })
  }
  

}

type registrationBody = { 
  userId: string, /// min:100000, max: 999999
}

type registrationResponse = {
  pass: string
}