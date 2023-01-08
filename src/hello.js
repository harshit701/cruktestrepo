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
                    const jsonFileData = JSON.parse(downloadedFile.Body.toString("utf-8"));
                    if (!jsonFileData[body.phoneNumber]) {
                        // add key in json
                        jsonFileData[body.phoneNumber] = 1;
                    }
                    else {
                        // increment key value
                        jsonFileData[body.phoneNumber] += 1;
                    }
                    try {
                        await s3upload({
                            ...params,
                            Body: JSON.stringify(jsonFileData),
                            ContentType: "application/json",
                        });
                        if (jsonFileData[body.phoneNumber] >= 2) {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaGVsbG8uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJoZWxsby50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7QUFDQSxzREFBMEI7QUFFMUIsaUJBQUcsQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLEVBQUUsTUFBTSxFQUFFLFdBQVcsRUFBRSxDQUFDLENBQUM7QUFFM0MsMkJBQTJCO0FBQzNCLE1BQU0sRUFBRSxHQUFHLElBQUksaUJBQUcsQ0FBQyxFQUFFLEVBQUUsQ0FBQztBQUV4Qiw0QkFBNEI7QUFDNUIsTUFBTSxHQUFHLEdBQUcsSUFBSSxpQkFBRyxDQUFDLEdBQUcsRUFBRSxDQUFDO0FBRTFCLE1BQU0sTUFBTSxHQUFHLEVBQUUsTUFBTSxFQUFFLGdCQUFnQixFQUFFLEdBQUcsRUFBRSxjQUFjLEVBQUUsQ0FBQztBQUNqRSxNQUFNLGVBQWUsR0FBRyxrQ0FBa0MsQ0FBQztBQUMzRCxNQUFNLGNBQWMsR0FDbEIsZ0ZBQWdGLENBQUM7QUFFNUUsTUFBTSxPQUFPLEdBQUcsS0FBSyxFQUFFLEtBQXNCLEVBQUUsRUFBRTtJQUN0RCxJQUFJO1FBQ0YsSUFBSSxLQUFLLENBQUMsVUFBVSxLQUFLLE1BQU0sRUFBRTtZQUMvQixNQUFNLElBQUksR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxJQUFjLENBQUMsQ0FBQztZQUU5QyxJQUFJLElBQUksQ0FBQyxXQUFXLEVBQUU7Z0JBQ3BCLDJDQUEyQztnQkFDM0MsSUFBSSxjQUFjLEdBQUcsTUFBTSxVQUFVLENBQUMsTUFBTSxDQUFDLENBQUM7Z0JBQzlDLElBQUksQ0FBQyxjQUFjLEVBQUU7b0JBQ25CLHdCQUF3QjtvQkFDeEIsTUFBTSxRQUFRLENBQUMsTUFBTSxDQUFDLENBQUM7b0JBRXZCLGNBQWMsR0FBRyxNQUFNLFVBQVUsQ0FBQyxNQUFNLENBQUMsQ0FBQztpQkFDM0M7Z0JBRUQsbUJBQW1CO2dCQUNuQixJQUFJLGNBQWMsQ0FBQyxhQUFhLEdBQUcsQ0FBQyxFQUFF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