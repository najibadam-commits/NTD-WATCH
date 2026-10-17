import { useMockControls } from '../mock/controls';
import { resetServerDb } from '../mock/serverDb';
import { useConnectivity } from '../offline/connectivity';
import { resetLocalDb } from '../offline/localDb';

/** Gives a test a clean device, a clean mock server and a working connection. */
export async function resetAll(): Promise<void> {
  await resetLocalDb();
  await resetServerDb();
  useMockControls.getState().reset();
  useConnectivity.setState({ browserOnline: true, simulatedOffline: false });
}
