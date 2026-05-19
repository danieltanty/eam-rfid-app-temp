import { v4 as uuidv4 } from "uuid";

/**
 * Field helpers
 */
export const UDSField = {
  text: (name, value = "") => ({
    USERDEFINEDSCREENFIELDNAME: name,
    USERDEFINEDSCREENFIELDVALUE: {
      TEXTDATA: value
    }
  }),

  number: (name, value = 0) => ({
    USERDEFINEDSCREENFIELDNAME: name,
    USERDEFINEDSCREENFIELDVALUE: {
      NUMERICDATA: {
        VALUE: value,
        NUMOFDEC: 0,
        SIGN: "+",
        CURRENCY: "xxx",
        DRCR: "D",
        qualifier: "OTHER"
      }
    }
  }),

  uuid: (name) => ({
    USERDEFINEDSCREENFIELDNAME: name,
    USERDEFINEDSCREENFIELDVALUE: {
      TEXTDATA: uuidv4().toUpperCase()
    }
  })
};

/**
 * Main builder
 */
export function buildUDSRequest({
  screenName,
  action = "ADD",
  fields = []
}) {
  return {
    USERDEFINEDSCREENNAME: screenName,
    USERDEFINEDSERVICEACTION: action,
    USERDEFINEDSCREENFIELDVALUELIST: {
      USERDEFINEDSCREENFIELDVALUEPAIR: fields
    }
  };
}