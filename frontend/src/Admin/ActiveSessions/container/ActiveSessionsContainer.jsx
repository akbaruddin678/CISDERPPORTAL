import { useState, useCallback } from "react";

import {
  useGetActiveSessionsQuery,
  useRevokeSessionMutation,
} from "../api/activeSessionsApi";
import { useGlobalAlert } from "../../../shared/Alert/context/AlertContext";
import ActiveSessionsView from "../view/ActiveSessionsView";

const ActiveSessionsContainer = () => {
  const { openAlert } = useGlobalAlert();
  const [revokingId, setRevokingId] = useState(null);

  const { data, isLoading, isFetching, refetch } = useGetActiveSessionsQuery(
    undefined,
    { pollingInterval: 20000 },
  );
  const [revokeSession] = useRevokeSessionMutation();

  const handleRevoke = useCallback(
    async (id) => {
      setRevokingId(id);
      try {
        await revokeSession(id).unwrap();
        openAlert?.({
          severity: "success",
          message: "User has been logged out.",
        });
      } catch {
        openAlert?.({ severity: "error", message: "Failed to force logout." });
      } finally {
        setRevokingId(null);
      }
    },
    [revokeSession, openAlert],
  );

  const sessions = data?.sessions || [];
  const onlineCount = sessions.filter((s) => s.online).length;

  return (
    <ActiveSessionsView
      sessions={sessions}
      total={data?.total || 0}
      onlineCount={onlineCount}
      isLoading={isLoading}
      isFetching={isFetching}
      onRefresh={refetch}
      onRevoke={handleRevoke}
      revokingId={revokingId}
    />
  );
};

export default ActiveSessionsContainer;
