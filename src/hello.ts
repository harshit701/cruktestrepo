import { APIGatewayEvent } from "aws-lambda";
import aws from "aws-sdk";
import dotenv from "dotenv";

dotenv.config();

aws.config.update({ region: process.env.AWSREGION });

// Create S3 service object
const s3 = new aws.S3();

// Create SNS service object
const sns = new aws.SNS();

const params = { Bucket: process.env.BUCKET, Key: process.env.BUCKETKEY };
const THANKYOUMESSAGE = "Thank you so much for donating!!";
const SPECIALMESSAGE =
  "Thank you so much for multiple donations. You should receive message shortly!!";

export const handler = async (event: APIGatewayEvent) => {
  try {
    if (event.httpMethod === "POST") {
      const body = JSON.parse(event.body as string);

      if (body.phoneNumber) {
        // check file is available or not in bucket
        let downloadedFile = await s3download(params);
        if (!downloadedFile) {
          // create file in bucket
          await s3upload(params);

          downloadedFile = await s3download(params);
        }

        // if file has data
        if (downloadedFile.ContentLength > 0) {
          const jsonBytes = JSON.parse(downloadedFile.Body.toString("utf-8"));
          if (!jsonBytes[body.phoneNumber]) {
            // add key in json
            jsonBytes[body.phoneNumber] = 1;
          } else {
            // increment key value
            jsonBytes[body.phoneNumber] = jsonBytes[body.phoneNumber] + 1;
          }

          try {
            await s3upload({
              ...params,
              Body: JSON.stringify(jsonBytes),
              ContentType: "application/json",
            });

            if (jsonBytes[body.phoneNumber] >= 2) {
              try {
                // publish message to mobile number
                await publishMessage({
                  Message: {
                    message: THANKYOUMESSAGE,
                    phoneNumber: `+44${body.phoneNumber}`,
                  },
                });

                return {
                  body: SPECIALMESSAGE,
                };
              } catch (error) {
                console.log(
                  "error while sending message to mobile number",
                  error
                );
                return { body: error };
              }
            }

            return {
              body: THANKYOUMESSAGE,
            };
          } catch (error) {
            console.log("error in upload file", error);
            return { body: error };
          }
        } else {
          // write file with data which are coming from request
          const bodyParam = {
            [body.phoneNumber]: 1,
          };
          await s3upload({
            ...params,
            Body: JSON.stringify(bodyParam),
            ContentType: "application/json",
          });
          return {
            body: THANKYOUMESSAGE,
          };
        }
      } else {
        return { body: `Phone Number is mandatory!` };
      }
    } else {
      return { body: `${event.httpMethod} method called!` };
    }
  } catch (error) {
    console.log("Catch Error===============>>", error);
    return { body: error };
  }
};

const publishMessage = (bodyMsg: any): any => {
  return new Promise((resolve, reject) => {
    sns.publish(
      {
        Message: bodyMsg.Message.message,
        PhoneNumber: bodyMsg.Message.phoneNumber,
      },
      (err: Error, data: any) => {
        if (err) {
          reject(err);
        } else {
          resolve(data);
        }
      }
    );
  });
};

const s3download = (params: any): Promise<any> => {
  return new Promise((resolve) => {
    s3.getObject(params, (err: Error, data: any) => {
      if (err) {
        console.log("download file error", err);
        resolve(false);
      } else {
        resolve(data);
      }
    });
  });
};

const s3upload = (params: any) => {
  return new Promise((resolve, reject) => {
    s3.putObject(params, (err: Error, data: any) => {
      if (err) {
        console.log("Upload file error", err);
        resolve(err);
      } else {
        resolve(data);
      }
    });
  });
};
