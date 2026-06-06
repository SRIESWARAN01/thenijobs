using System;
using System.Diagnostics;
using System.IO;
using System.Text;
using System.Collections.Generic;

class NpmWrapper
{
    static int Main(string[] args)
    {
        string nodePath = "node";
        string npmCliPath = @"C:\Program Files\nodejs\node_modules\npm\bin\npm-cli.js";

        var newArgsList = new List<string>();
        newArgsList.Add(npmCliPath);
        newArgsList.AddRange(args);

        string argumentsString = EscapeArguments(newArgsList);

        ProcessStartInfo psi = new ProcessStartInfo();
        psi.FileName = nodePath;
        psi.Arguments = argumentsString;
        psi.UseShellExecute = false;
        psi.RedirectStandardOutput = false;
        psi.RedirectStandardError = false;
        psi.RedirectStandardInput = false;

        try
        {
            using (Process p = Process.Start(psi))
            {
                p.WaitForExit();
                return p.ExitCode;
            }
        }
        catch (Exception ex)
        {
            Console.Error.WriteLine("Error launching npm wrapper: " + ex.Message);
            return 1;
        }
    }

    static string EscapeArguments(IEnumerable<string> args)
    {
        StringBuilder sb = new StringBuilder();
        foreach (string arg in args)
        {
            if (sb.Length > 0)
                sb.Append(" ");

            bool needQuotes = arg.Length == 0 || arg.Contains(" ") || arg.Contains("\t") || arg.Contains("\"") || arg.Contains("\n") || arg.Contains("\r");
            if (needQuotes)
            {
                sb.Append("\"");
                for (int i = 0; i < arg.Length; i++)
                {
                    char c = arg[i];
                    if (c == '\\')
                    {
                        int count = 0;
                        while (i < arg.Length && arg[i] == '\\')
                        {
                            count++;
                            i++;
                        }
                        if (i == arg.Length)
                        {
                            sb.Append(new string('\\', count * 2));
                        }
                        else if (arg[i] == '"')
                        {
                            sb.Append(new string('\\', count * 2 + 1));
                            sb.Append('"');
                        }
                        else
                        {
                            sb.Append(new string('\\', count));
                            sb.Append(arg[i]);
                        }
                    }
                    else if (c == '"')
                    {
                        sb.Append("\\\"");
                    }
                    else
                    {
                        sb.Append(c);
                    }
                }
                sb.Append("\"");
            }
            else
            {
                sb.Append(arg);
            }
        }
        return sb.ToString();
    }
}
