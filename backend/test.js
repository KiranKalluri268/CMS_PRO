const { marshall, unmarshall } = require('@aws-sdk/util-dynamodb');

const test = () => {
  const data = { year: 2024 };
  const marshalledData = marshall(data);
  console.log(marshalledData);
  const unmarshalledItem = unmarshall(marshalledData);
console.log(unmarshalledItem);
};

test();
