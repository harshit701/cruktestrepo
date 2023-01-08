"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const aws_sdk_1 = __importDefault(require("aws-sdk"));
aws_sdk_1.default.config.update({ region: "eu-west-2" });
// Create S3 service object
const s3 = new aws_sdk_1.default.S3();
// Create SNS service object
const sns = new aws_sdk_1.default.SNS();
const params = { Bucket: "donationbucket", Key: "abctest.json" };
const THANKYOUMESSAGE = "Thank you so much for donating!!";
const SPECIALMESSAGE = "Thank you so much for multiple donations. You should receive message shortly!!";
const handler = async (event) => {
    try {
        if (event.httpMethod === "POST") {
            const body = JSON.parse(event.body);
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
                    }
                    else {
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
                            }
                            catch (error) {
                                console.log("error while sending message to mobile number", error);
                                return { body: error };
                            }
                        }
                        return {
                            body: THANKYOUMESSAGE,
                        };
                    }
                    catch (error) {
                        console.log("error in upload file", error);
                        return { body: error };
                    }
                }
                else {
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
            }
            else {
                return { body: `Phone Number is mandatory!` };
            }
        }
        else {
            return { body: `${event.httpMethod} method called!` };
        }
    }
    catch (error) {
        console.log("Catch Error===============>>", error);
        return { body: error };
    }
};
exports.handler = handler;
const publishMessage = (bodyMsg) => {
    return new Promise((resolve, reject) => {
        sns.publish({
            Message: bodyMsg.Message.message,
            PhoneNumber: bodyMsg.Message.phoneNumber,
        }, (err, data) => {
            if (err) {
                reject(err);
            }
            else {
                resolve(data);
            }
        });
    });
};
const s3download = (params) => {
    return new Promise((resolve) => {
        s3.getObject(params, (err, data) => {
            if (err) {
                console.log("download file error", err);
                resolve(false);
            }
            else {
                resolve(data);
            }
        });
    });
};
const s3upload = (params) => {
    return new Promise((resolve, reject) => {
        s3.putObject(params, (err, data) => {
            if (err) {
                console.log("Upload file error", err);
                resolve(err);
            }
            else {
                resolve(data);
            }
        });
    });
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaGVsbG8uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJoZWxsby50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7QUFDQSxzREFBMEI7QUFFMUIsaUJBQUcsQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLEVBQUUsTUFBTSxFQUFFLFdBQVcsRUFBRSxDQUFDLENBQUM7QUFFM0MsMkJBQTJCO0FBQzNCLE1BQU0sRUFBRSxHQUFHLElBQUksaUJBQUcsQ0FBQyxFQUFFLEVBQUUsQ0FBQztBQUV4Qiw0QkFBNEI7QUFDNUIsTUFBTSxHQUFHLEdBQUcsSUFBSSxpQkFBRyxDQUFDLEdBQUcsRUFBRSxDQUFDO0FBRTFCLE1BQU0sTUFBTSxHQUFHLEVBQUUsTUFBTSxFQUFFLGdCQUFnQixFQUFFLEdBQUcsRUFBRSxjQUFjLEVBQUUsQ0FBQztBQUNqRSxNQUFNLGVBQWUsR0FBRyxrQ0FBa0MsQ0FBQztBQUMzRCxNQUFNLGNBQWMsR0FDbEIsZ0ZBQWdGLENBQUM7QUFFNUUsTUFBTSxPQUFPLEdBQUcsS0FBSyxFQUFFLEtBQXNCLEVBQUUsRUFBRTtJQUN0RCxJQUFJO1FBQ0YsSUFBSSxLQUFLLENBQUMsVUFBVSxLQUFLLE1BQU0sRUFBRTtZQUMvQixNQUFNLElBQUksR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxJQUFjLENBQUMsQ0FBQztZQUU5QyxJQUFJLElBQUksQ0FBQyxXQUFXLEVBQUU7Z0JBQ3BCLDJDQUEyQztnQkFDM0MsSUFBSSxjQUFjLEdBQUcsTUFBTSxVQUFVLENBQUMsTUFBTSxDQUFDLENBQUM7Z0JBQzlDLElBQUksQ0FBQyxjQUFjLEVBQUU7b0JBQ25CLHdCQUF3QjtvQkFDeEIsTUFBTSxRQUFRLENBQUMsTUFBTSxDQUFDLENBQUM7b0JBRXZCLGNBQWMsR0FBRyxNQUFNLFVBQVUsQ0FBQyxNQUFNLENBQUMsQ0FBQztpQkFDM0M7Z0JBRUQsbUJBQW1CO2dCQUNuQixJQUFJLGNBQWMsQ0FBQyxhQUFhLEdBQUcsQ0FBQyxFQUFFO29CQUNwQyxNQUFNLFNBQVMsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7b0JBQ3BFLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxFQUFFO3dCQUNoQyxrQkFBa0I7d0JBQ2xCLFNBQVMsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxDQUFDO3FCQUNqQzt5QkFBTTt3QkFDTCxzQkFBc0I7d0JBQ3RCLFNBQVMsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLEdBQUcsU0FBUyxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDLENBQUM7cUJBQy9EO29CQUVELElBQUk7d0JBQ0YsTUFBTSxRQUFRLENBQUM7NEJBQ2IsR0FBRyxNQUFNOzRCQUNULElBQUksRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQzs0QkFDL0IsV0FBVyxFQUFFLGtCQUFrQjt5QkFDaEMsQ0FBQyxDQUFDO3dCQUVILElBQUksU0FBUyxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLEVBQUU7NEJBQ3BDLElBQUk7Z0NBQ0YsbUNBQW1DO2dDQUNuQyxNQUFNLGNBQWMsQ0FBQztvQ0FDbkIsT0FBTyxFQUFFO3dDQUNQLE9BQU8sRUFBRSxlQUFlO3dDQUN4QixXQUFXLEVBQUUsTUFBTSxJQUFJLENBQUMsV0FBVyxFQUFFO3FDQUN0QztpQ0FDRixDQUFDLENBQUM7Z0NBRUgsT0FBTztvQ0FDTCxJQUFJLEVBQUUsY0FBYztpQ0FDckIsQ0FBQzs2QkFDSDs0QkFBQyxPQUFPLEtBQUssRUFBRTtnQ0FDZCxPQUFPLENBQUMsR0FBRyxDQUNULDhDQUE4QyxFQUM5QyxLQUFLLENBQ04sQ0FBQztnQ0FDRixPQUFPLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRSxDQUFDOzZCQUN4Qjt5QkFDRjt3QkFFRCxPQUFPOzRCQUNMLElBQUksRUFBRSxlQUFlO3lCQUN0QixDQUFDO3FCQUNIO29CQUFDLE9BQU8sS0FBSyxFQUFFO3dCQUNkLE9BQU8sQ0FBQyxHQUFHLENBQUMsc0JBQXNCLEVBQUUsS0FBSyxDQUFDLENBQUM7d0JBQzNDLE9BQU8sRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFFLENBQUM7cUJBQ3hCO2lCQUNGO3FCQUFNO29CQUNMLHFEQUFxRDtvQkFDckQsTUFBTSxTQUFTLEdBQUc7d0JBQ2hCLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxFQUFFLENBQUM7cUJBQ3RCLENBQUM7b0JBQ0YsTUFBTSxRQUFRLENBQUM7d0JBQ2IsR0FBRyxNQUFNO3dCQUNULElBQUksRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQzt3QkFDL0IsV0FBVyxFQUFFLGtCQUFrQjtxQkFDaEMsQ0FBQyxDQUFDO29CQUNILE9BQU87d0JBQ0wsSUFBSSxFQUFFLGVBQWU7cUJBQ3RCLENBQUM7aUJBQ0g7YUFDRjtpQkFBTTtnQkFDTCxPQUFPLEVBQUUsSUFBSSxFQUFFLDRCQUE0QixFQUFFLENBQUM7YUFDL0M7U0FDRjthQUFNO1lBQ0wsT0FBTyxFQUFFLElBQUksRUFBRSxHQUFHLEtBQUssQ0FBQyxVQUFVLGlCQUFpQixFQUFFLENBQUM7U0FDdkQ7S0FDRjtJQUFDLE9BQU8sS0FBSyxFQUFFO1FBQ2QsT0FBTyxDQUFDLEdBQUcsQ0FBQyw4QkFBOEIsRUFBRSxLQUFLLENBQUMsQ0FBQztRQUNuRCxPQUFPLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRSxDQUFDO0tBQ3hCO0FBQ0gsQ0FBQyxDQUFDO0FBdEZXLFFBQUEsT0FBTyxXQXNGbEI7QUFFRixNQUFNLGNBQWMsR0FBRyxDQUFDLE9BQVksRUFBTyxFQUFFO0lBQzNDLE9BQU8sSUFBSSxPQUFPLENBQUMsQ0FBQyxPQUFPLEVBQUUsTUFBTSxFQUFFLEVBQUU7UUFDckMsR0FBRyxDQUFDLE9BQU8sQ0FDVDtZQUNFLE9BQU8sRUFBRSxPQUFPLENBQUMsT0FBTyxDQUFDLE9BQU87WUFDaEMsV0FBVyxFQUFFLE9BQU8sQ0FBQyxPQUFPLENBQUMsV0FBVztTQUN6QyxFQUNELENBQUMsR0FBVSxFQUFFLElBQVMsRUFBRSxFQUFFO1lBQ3hCLElBQUksR0FBRyxFQUFFO2dCQUNQLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQzthQUNiO2lCQUFNO2dCQUNMLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQzthQUNmO1FBQ0gsQ0FBQyxDQUNGLENBQUM7SUFDSixDQUFDLENBQUMsQ0FBQztBQUNMLENBQUMsQ0FBQztBQUVGLE1BQU0sVUFBVSxHQUFHLENBQUMsTUFBVyxFQUFnQixFQUFFO0lBQy9DLE9BQU8sSUFBSSxPQUFPLENBQUMsQ0FBQyxPQUFPLEVBQUUsRUFBRTtRQUM3QixFQUFFLENBQUMsU0FBUyxDQUFDLE1BQU0sRUFBRSxDQUFDLEdBQVUsRUFBRSxJQUFTLEVBQUUsRUFBRTtZQUM3QyxJQUFJLEdBQUcsRUFBRTtnQkFDUCxPQUFPLENBQUMsR0FBRyxDQUFDLHFCQUFxQixFQUFFLEdBQUcsQ0FBQyxDQUFDO2dCQUN4QyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUM7YUFDaEI7aUJBQU07Z0JBQ0wsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDO2FBQ2Y7UUFDSCxDQUFDLENBQUMsQ0FBQztJQUNMLENBQUMsQ0FBQyxDQUFDO0FBQ0wsQ0FBQyxDQUFDO0FBRUYsTUFBTSxRQUFRLEdBQUcsQ0FBQyxNQUFXLEVBQUUsRUFBRTtJQUMvQixPQUFPLElBQUksT0FBTyxDQUFDLENBQUMsT0FBTyxFQUFFLE1BQU0sRUFBRSxFQUFFO1FBQ3JDLEVBQUUsQ0FBQyxTQUFTLENBQUMsTUFBTSxFQUFFLENBQUMsR0FBVSxFQUFFLElBQVMsRUFBRSxFQUFFO1lBQzdDLElBQUksR0FBRyxFQUFFO2dCQUNQLE9BQU8sQ0FBQyxHQUFHLENBQUMsbUJBQW1CLEVBQUUsR0FBRyxDQUFDLENBQUM7Z0JBQ3RDLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQzthQUNkO2lCQUFNO2dCQUNMLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQzthQUNmO1FBQ0gsQ0FBQyxDQUFDLENBQUM7SUFDTCxDQUFDLENBQUMsQ0FBQztBQUNMLENBQUMsQ0FBQyJ9