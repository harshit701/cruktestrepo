import { APIGatewayProxyEvent } from "aws-lambda";
import { handler } from "../src/hello";

describe("Unit test for app handler", () => {
  // successful response
  it("verifies successful response", async () => {
    const event: APIGatewayProxyEvent = {
      body: JSON.stringify({
        phoneNumber: "1234567890",
        donation: 100,
      }),
      httpMethod: "POST",
    } as any;
    const result = await handler(event);
    if (result) {
      expect(result.body).toEqual(
        `Thank you so much for multiple donations. You should receive message shortly!!`
      );
    }
  });

  // blank body
  it("Blank body parameter", async () => {
    const event: APIGatewayProxyEvent = {
      body: JSON.stringify({}),
      httpMethod: "POST",
    } as any;
    const result = await handler(event);
    if (result) {
      expect(result.body).toEqual(`Phone Number is mandatory!`);
    }
  });

  // GET Method
  it("Get Method request", async () => {
    const event: APIGatewayProxyEvent = { httpMethod: "GET" } as any;
    const result = await handler(event);
    if (result) {
      expect(result.body).toEqual(`${event.httpMethod} method called!`);
    }
  });
});
