import { Construct } from "constructs";
import { App, TerraformOutput, TerraformStack } from "cdktf";
import * as aws from './.gen/providers/aws'

class MyStack extends TerraformStack {
  constructor(scope: Construct, name: string) {
    super(scope, name);
    new aws.AwsProvider(this, 'aws-provider', {
      region: 'us-west-2'
    })
    const vpcNetwork = new aws.vpc.Vpc(this, 'wp-vpc', {
      enableDnsHostnames: true,
      cidrBlock: '10.0.0.0/16',
    })
    const azs = ["a", "b", "c"].map((i) => `us-west-2${i}`)
    
    const publicSubnetOne = new aws.vpc.Subnet(this, 'wp-subnet-1', {
      vpcId: vpcNetwork.id,
      availabilityZone: azs[0],
      cidrBlock: '10.0.0.0/24',
      dependsOn: [vpcNetwork]
    })

    const publicSubnetTwo = new aws.vpc.Subnet(this, 'wp-subnet-2', {
      vpcId: vpcNetwork.id,
      availabilityZone: azs[1],
      cidrBlock: '10.0.1.0/24',
      dependsOn: [vpcNetwork]
    })

    const privateSubnetOne = new aws.vpc.Subnet(this, 'wp-subnet-pri-1', {
      vpcId: vpcNetwork.id,
      availabilityZone: azs[0],
      cidrBlock: '10.0.2.0/24',
      dependsOn: [vpcNetwork]
    })

    const privateSubnetTwo = new aws.vpc.Subnet(this, 'wp-subnet-pri-2', {
      vpcId: vpcNetwork.id,
      availabilityZone: azs[1],
      cidrBlock: '10.0.3.0/24',
      dependsOn: [vpcNetwork]
    })

    const igw = new aws.vpc.InternetGateway(this, 'wp-igw', {
      vpcId: vpcNetwork.id,
      dependsOn: [vpcNetwork]
    })

    const publicRouteTable = new aws.vpc.RouteTable(this, 'wp-pub-route', {
      vpcId: vpcNetwork.id,
      route: [
        {
          gatewayId: igw.id,
          cidrBlock: '0.0.0.0/0',
          
        }
      ],
      dependsOn: [vpcNetwork, igw]
    })
    new aws.vpc.RouteTableAssociation(this, 'wp-public-asso-1', {
      subnetId: publicSubnetOne.id,
      routeTableId: publicRouteTable.id,
      dependsOn: [vpcNetwork, publicSubnetOne]
    })

   new aws.vpc.RouteTableAssociation(this, 'wp-public-asso-2', {
      subnetId: publicSubnetTwo.id,
      routeTableId: publicRouteTable.id
    })

    const natGwOne = new aws.vpc.NatGateway(this, 'wp-nat-1', {
      subnetId: publicSubnetOne.id
    })

    const natGwTwo = new aws.vpc.NatGateway(this, 'wp-nat-2', {
      subnetId: publicSubnetTwo.id
    })

    const priRouteTableOne = new aws.vpc.RouteTable(this, 'pri-routetable-1', {
      vpcId: vpcNetwork.id,
      route: [
        {
          natGatewayId: natGwOne.id,
          cidrBlock: '0.0.0.0/0'
        }
      ]
    })

    const priRouteTableTwo = new aws.vpc.RouteTable(this, 'private-routetable-2', {
      vpcId: vpcNetwork.id,
      route: [
        {
          natGatewayId: natGwTwo.id,
          cidrBlock: '0.0.0.0/0'
        }
      ]
    })

    new aws.vpc.RouteTableAssociation(this, 'priv-asso-1', {
      subnetId: privateSubnetOne.id,
      routeTableId: privateSubnetOne.id
    })

    new aws.vpc.RouteTableAssociation(this, 'priv-asso-2', {
      subnetId: privateSubnetTwo.id,
      routeTableId: privateSubnetTwo.id
    })

    new TerraformOutput(this, 'vpc-id', {
      value: vpcNetwork.id
    })
  }
}

const app = new App();
new MyStack(app, "cdktf-wordpress");
app.synth();
