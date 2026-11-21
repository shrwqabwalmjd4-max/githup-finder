import { useEffect, useState } from "react";

export default function App() {
  const [query, setQuery] = useState(() => localStorage.getItem("lastGithubUser") || "");
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [time, setTime] = useState(() => new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      document.title = "GitHub Finder";
    } else if (status === "done" && user?.login) {
      document.title = `${user.login} | GitHub Finder`;
    } else {
      document.title = `${trimmed} - GitHub Finder`;
    }
  }, [query, status, user]);

  useEffect(() => {
    const trimmed = query.trim();

    if (!trimmed) {
      setUser(null);
      setStatus("idle");
      setErrorMsg("");
      localStorage.removeItem("lastGithubUser");
      return;
    }

    localStorage.setItem("lastGithubUser", trimmed);

    const controller = new AbortController();
    let ignore = false;

    const timer = setTimeout(async () => {
      setStatus("loading");
      setErrorMsg("");

      try {
        const res = await fetch(`https://api.github.com/users/${encodeURIComponent(trimmed)}`, {
          signal: controller.signal,
        });

        if (ignore) return;

        if (!res.ok) {
          setUser(null);
          setStatus("error");
          setErrorMsg(res.status === 404 ? "User not found (404)" : `Error: ${res.status}`);
          return;
        }

        const data = await res.json();
        if (ignore) return;

        setUser(data);
        setStatus("done");
      } catch (err) {
        if (err.name === "AbortError" || ignore) return;
        setUser(null);
        setStatus("error");
        setErrorMsg("Network error");
      }
    }, 500);

    return () => {
      ignore = true;
      controller.abort();
      clearTimeout(timer);
    };
  }, [query]);

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6">
      <div className="max-w-xl mx-auto">
        <header className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
          <h1 className="text-2xl font-bold text-emerald-400">GitHub User Finder</h1>
          <span className="text-sm font-mono bg-slate-900 px-3 py-1 rounded-md text-slate-300">
            {time.toLocaleTimeString()}
          </span>
        </header>

        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Enter GitHub username..."
          className="w-full px-4 py-3 rounded-lg bg-slate-900 border border-slate-700 focus:outline-none focus:border-emerald-400 mb-6"
        />

        {status === "idle" && (
          <p className="text-center text-slate-400">Type a username to search...</p>
        )}

        {status === "loading" && (
          <p className="text-center text-emerald-400">Loading...</p>
        )}

        {status === "error" && (
          <div className="p-4 rounded-lg bg-red-950/60 border border-red-700 text-red-300 text-center">
            {errorMsg}
          </div>
        )}

        {status === "done" && user && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <div className="flex items-center gap-4">
              <img
                src={user.avatar_url}
                alt={user.login}
                className="w-20 h-20 rounded-full border-2 border-emerald-400 object-cover"
              />
              <div>
                <h2 className="text-xl font-bold">{user.name || user.login}</h2>
                <p className="text-sm text-emerald-400">@{user.login}</p>
              </div>
            </div>

            <p className="text-slate-300 mt-4">{user.bio || "No bio available"}</p>

            <div className="grid grid-cols-2 gap-4 mt-6 bg-slate-950 p-4 rounded-lg text-center">
              <div>
                <p className="text-xs text-slate-400">Followers</p>
                <p className="text-xl font-bold">{user.followers}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Public Repos</p>
                <p className="text-xl font-bold">{user.public_repos}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}