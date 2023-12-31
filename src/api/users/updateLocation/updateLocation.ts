import { Request, Response } from "express";
import { client } from "../../../db/connection";
import * as bcrypt from 'bcrypt';
import { ErrorMessages } from "../../../../types";


export const updateLocation = async ( req: Request, res: Response) => {

  const body = req.body as updateBody;
  const userId: string | null = body["userId"];
  const location = body["location"];
  const hash = body["hash"];

  const stopSharing = body["stopSharing"];

  const accounts = client.db('path_finders').collection('accounts');
  const userLocations = client.db('path_finders').collection('userLocations');


  try{
    if ( userId && stopSharing === "true" && hash ){

      const user = await accounts.findOne({ userId: userId });
      if ( !user ){ throw "No account." }
      const pass = user["pass"];

      await bcrypt.compare( hash, pass )
        .catch( error => { throw "Invalid Request. Try erasing the app data." } );


      const deletedDate = new Date( '1900' );

      await userLocations.updateOne(
        { userId: userId },
        { 
          $unset: {
          location: ""
          },
          $set:{
            updatedAt: deletedDate
          }
        }
      )

      return res.json({
        data: {
          updatedAt: deletedDate
        }
      });


    }
    else if ( userId && hash && location && location["latitude"] && location["longitude"]  ){

      const latitude = Number.parseFloat( location.latitude );
      const longitude = Number.parseFloat( location.longitude );
      const currentDate = new Date();

      if ( Number.isNaN( latitude ) || Number.isNaN ( longitude ) ){
        throw "Invalid Location.";
      }

      const user = await accounts.findOne({ userId: userId });
      if ( !user ){ throw "No account." }
      const pass = user["pass"];

      await bcrypt.compare( hash, pass )
        .catch( error => { throw "Invalid Request. Try erasing the app data." } );

      await userLocations.updateOne(
        { userId: userId },
        { $set: {
          location: {
            type: "Point",
            coordinates: {
              longitude: longitude,
              latitude: latitude
            }
          },
          updatedAt: currentDate
        }},
        { upsert: true }
      )

      res.json({
        data: {
          updatedAt: currentDate
        }
      })



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
    });
  }
  
}

type updateBody = {
  userId : string,
  hash   : string,
  location: {
    longitude: string,
    latitude: string
  },
  stopSharing: string
}